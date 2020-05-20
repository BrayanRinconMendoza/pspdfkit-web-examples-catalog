import PSPDFKit from "pspdfkit";

let instance = null;

let peepholeAnnotationsOnPageIndexes = new Set();
let obscureAnnotationsOnPageIndexes = new Set();

const AnnotationRenderer = ({ annotation }) => {
  if (!isPeepholeAnnotation(annotation)) {
    return null;
  }

  const node = document.createElement("div");
  node.innerHTML = `
    <div class="Peephole-Top"></div>
    <div class="Peephole-Bottom"></div>
    <div class="Peephole-Left"></div>
    <div class="Peephole-Right"></div>
    <div class="Peephole-TopLeft"></div>
    <div class="Peephole-TopRight"></div>
    <div class="Peephole-BottomLeft"></div>
    <div class="Peephole-BottomRight"></div>
    <div class="Peephole-Center"></div>
  `;
  node.style.pointerEvents = "all";
  node.onclick = function() {
    const selectedAnnotation = instance.getSelectedAnnotation();
    if (!selectedAnnotation) {
      setTimeout(() => instance.setSelectedAnnotation(annotation.id), 0);
    }
  };

  return {
    node,
    append: true,
    onDisappear: () => {}
  };
};

export async function load(defaultConfiguration) {
  instance = await PSPDFKit.load({
    ...defaultConfiguration,
    toolbarItems: createToolbarItems(),
    styleSheets: ["/obscure-annotations/static/style.css"],
    initialViewState: new PSPDFKit.ViewState({
      enableAnnotationToolbar: false
    }),
    annotationTooltipCallback,

    // Add a callback to the Annotation key in the customRenderers configuration
    // field to customize the annotation's appearance by adding a DOM node to
    // it.
    //
    // We use this to implement a custom renderer for peephole annotations.
    customRenderers: {
      Annotation: AnnotationRenderer
    }
  });

  // Whenever the page changes, we want to also update the toolbar.
  instance.addEventListener("viewState.currentPageIndex.change", updateToolbar);

  // Annotations can still be manually deleted. When this happens, we must also
  // update the toolbar.
  instance.addEventListener("annotations.delete", function onDelete(
    annotations
  ) {
    annotations
      .filter(isPeepholeAnnotation)
      .forEach(annotation =>
        peepholeAnnotationsOnPageIndexes.delete(annotation.pageIndex)
      );
    annotations
      .filter(isObscureAnnotation)
      .forEach(annotation =>
        obscureAnnotationsOnPageIndexes.delete(annotation.pageIndex)
      );

    updateToolbar();
  });

  // We initialize the peepholeAnnotationsOnPageIndexes and
  // obscureAnnotationsOnPageIndexes array so that we know which pages already
  // have those annotations.
  for (let pageIndex = 0; pageIndex < instance.totalPageCount; pageIndex++) {
    const annotations = await instance.getAnnotations(pageIndex);
    if (annotations.find(isPeepholeAnnotation)) {
      peepholeAnnotationsOnPageIndexes.add(pageIndex);
    }
    if (annotations.find(isObscureAnnotation)) {
      obscureAnnotationsOnPageIndexes.add(pageIndex);
    }
  }
  updateToolbar();

  registerIsDragAndResizeDetector();

  return instance;
}

// To simplify the example, we’re hiding some tools
const HIDDEN_TOOLBAR_ITEMS = [
  "annotate",
  "ink",
  "highlighter",
  "text-highlighter",
  "ink-signature",
  "image",
  "stamp",
  "note",
  "text",
  "line",
  "arrow",
  "rectangle",
  "ellipse",
  "polygon",
  "polyline",
  "print",
  "search"
];
function createToolbarItems() {
  const items = PSPDFKit.defaultToolbarItems.filter(
    item => !HIDDEN_TOOLBAR_ITEMS.includes(item.type)
  );

  if (instance) {
    const currentPageIndex = instance.viewState.currentPageIndex;

    const currentPageHasPeephole = peepholeAnnotationsOnPageIndexes.has(
      currentPageIndex
    );
    const currentPageHasObscure = obscureAnnotationsOnPageIndexes.has(
      currentPageIndex
    );

    if (currentPageHasPeephole) {
      items.push({
        type: "custom",
        title: "Remove Peephole Annotation",
        onPress: () => removeAnnotationsFromPage(currentPageIndex)
      });
    } else {
      items.push({
        type: "custom",
        title: "Add Peephole Annotation",
        onPress: () => addPeepholeAnnotation(currentPageIndex),
        disabled: currentPageHasObscure
      });
    }

    if (currentPageHasObscure) {
      items.push({
        type: "custom",
        title: "Remove Obscure Annotation",
        onPress: () => removeAnnotationsFromPage(currentPageIndex)
      });
    } else {
      items.push({
        type: "custom",
        title: "Add Obscure Annotation",
        onPress: () => addObscureAnnotation(currentPageIndex),
        disabled: currentPageHasPeephole
      });
    }
  }

  return items;
}

function updateToolbar() {
  instance.setToolbarItems(createToolbarItems());
}

async function addPeepholeAnnotation(currentPageIndex) {
  const annotation = await instance.createAnnotation(
    new PSPDFKit.Annotations.RectangleAnnotation({
      boundingBox: getRectInTheMiddleOfPage(currentPageIndex),
      pageIndex: currentPageIndex,
      strokeColor: null,
      customData: { peephole: true }
    })
  );
  instance.setSelectedAnnotation(annotation);

  peepholeAnnotationsOnPageIndexes.add(currentPageIndex);
  updateToolbar();
}

async function addObscureAnnotation(currentPageIndex) {
  const annotation = await instance.createAnnotation(
    new PSPDFKit.Annotations.RectangleAnnotation({
      boundingBox: getRectInTheMiddleOfPage(currentPageIndex),
      pageIndex: currentPageIndex,
      strokeColor: PSPDFKit.Color.BLACK,
      fillColor: PSPDFKit.Color.BLACK,
      customData: { obscure: true }
    })
  );
  instance.setSelectedAnnotation(annotation);

  obscureAnnotationsOnPageIndexes.add(currentPageIndex);
  updateToolbar();
}

async function removeAnnotationsFromPage(pageIndex) {
  const annotations = await instance.getAnnotations(pageIndex);

  annotations
    .filter(
      annotation =>
        isPeepholeAnnotation(annotation) || isObscureAnnotation(annotation)
    )
    .forEach(annotation => instance.deleteAnnotation(annotation.id));

  peepholeAnnotationsOnPageIndexes.delete(pageIndex);
  obscureAnnotationsOnPageIndexes.delete(pageIndex);
  updateToolbar();
}

function getRectInTheMiddleOfPage(pageIndex) {
  const pageSize = instance.pageInfoForIndex(pageIndex);
  const width = 200;
  const height = 100;

  return new PSPDFKit.Geometry.Rect({
    top: pageSize.height / 2 - height / 2,
    left: pageSize.width / 2 - width / 2,
    width,
    height
  });
}

function isPeepholeAnnotation(annotation) {
  const isRectangle =
    annotation instanceof PSPDFKit.Annotations.RectangleAnnotation;
  return isRectangle && annotation.customData.peephole === true;
}

function isObscureAnnotation(annotation) {
  const isRectangle =
    annotation instanceof PSPDFKit.Annotations.RectangleAnnotation;
  return isRectangle && annotation.customData.obscure === true;
}

// The annotation tooltip can be used to place annotation tools directly on top
// of the annotation on screen.
//
// In this example, we use it as an alternative to the default annotation
// toolbars.
//
// https://web-examples.pspdfkit.com/tooltips
function annotationTooltipCallback(annotation) {
  const deleteAnnotation = {
    type: "custom",
    title: "Delete",
    onPress: () => {
      if (confirm("Do you really want to delete the annotation?")) {
        instance.deleteAnnotation(annotation.id);
      }
    }
  };
  return [deleteAnnotation];
}

function registerIsDragAndResizeDetector() {
  let isDraggingOrResizing = false;

  instance.contentDocument.onmousedown = function(event) {
    if (svgElementHasClass(event.target, "PSPDFKit-Selection-Outline-Border")) {
      isDraggingOrResizing = true;
    }
    if (svgElementHasClass(event.target, "PSPDFKit-Resize-Anchor")) {
      isDraggingOrResizing = true;
    }
  };

  instance.contentDocument.onmouseup = function() {
    isDraggingOrResizing = false;
    instance.contentDocument.body.removeAttribute(
      "data-is-dragging-or-resizing",
      "true"
    );
  };

  instance.contentDocument.onmousemove = function(event) {
    if (event.buttons !== 1 || !isDraggingOrResizing) {
      return;
    }

    instance.contentDocument.body.setAttribute(
      "data-is-dragging-or-resizing",
      "true"
    );
  };
}

function svgElementHasClass(element, className) {
  if (typeof element.className.baseVal !== "string") {
    // Not an SVG element
    return false;
  }
  return element.className.baseVal.split(" ").indexOf(className) >= 0;
}
