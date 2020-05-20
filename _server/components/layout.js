import classes from "classnames";
import React from "react";
import PSPDFKit from "pspdfkit";

import ExampleList from "./example/list";
import InstantButton from "./buttons/instant-button";
import StandaloneDocumentButton from "./buttons/standalone-document-button";
import examples from "../examples";

export default class Layout extends React.Component {
  state = {
    showMobileSidebar: false,
    switchedExample: false
  };

  _overflowMenuRef = React.createRef();

  _toggleSidebar = () => {
    this.setState(prevState => {
      return { showMobileSidebar: !prevState.showMobileSidebar };
    });
  };

  _switchMobileBackend = nextBackend => {
    const { currentBackend, switchBackend } = this.props;
    // When clicking again on the current Backend in our switcher, we want to toggle the sidebar.
    if (currentBackend === nextBackend) {
      this.setState(prevState => {
        return { showMobileSidebar: !prevState.showMobileSidebar };
      });
    } else {
      this.setState({ showMobileSidebar: true });
    }
    if (currentBackend !== nextBackend) {
      switchBackend(nextBackend);
    }
  };

  _handleTabClick = event => {
    const { currentBackend, switchBackend } = this.props;

    const classList = event.target.classList;

    let nextBackend;
    if (classList.contains("sidebar__backend-tab--standalone")) {
      nextBackend = "standalone";
    } else if (classList.contains("sidebar__backend-tab--server")) {
      nextBackend = "server";
    } else {
      return;
    }

    if (currentBackend !== nextBackend) {
      switchBackend(nextBackend);
    }
  };

  _switchExample = nextExample => {
    // When switching examples, we want to hide the mobile sidebar
    this.setState({ showMobileSidebar: false, switchedExample: true });
    this.props.switchExample(nextExample);
  };

  _showCustomStandalonePdf = pdf => {
    // When opening a custom PDF, we want to hide the mobile sidebar
    this.setState({ showMobileSidebar: false });
    this.props.showCustomPdf(pdf, "standalone");
  };

  /**
   * Toggles overflow menu visibility
   *
   * @param {MouseEvent} event
   */
  _handleLayoutClick = event => {
    const overflowMenu = this._overflowMenuRef.current;
    if (event.target.classList.contains("header__overflow")) {
      overflowMenu.classList.toggle("header__overflow-contents--shown");
    } else if (
      (!event.target.classList.contains("header__overflow-contents") &&
        !overflowMenu.contains(event.target)) ||
      event.target.classList.contains("header__overflow-scrim")
    ) {
      overflowMenu.classList.remove("header__overflow-contents--shown");
    }
  };

  render() {
    const {
      header,
      children,
      currentBackend,
      currentExample,
      serverDocumentId
    } = this.props;

    const { showMobileSidebar } = this.state;
    const isServer = currentBackend === "server";

    const exampleData = examples.find(example => {
      return example.name === currentExample;
    });

    return (
      <div className="layout" onClick={this._handleLayoutClick}>
        <header className="header">
          <a
            href="https://pspdfkit.com"
            target="_blank"
            className="header__logo-anchor"
          >
            <img
              className="header__logo header__logo--small"
              src="static/logo-icon.svg"
            />

            <img
              className="header__logo header__logo--light"
              src="static/logo-light.svg"
            />

            <img
              className="header__logo header__logo--dark"
              src="static/logo-dark.svg"
            />
          </a>

          <a
            href={blogPostUrlForVersion(PSPDFKit.version)}
            target="_blank"
            className="header__whats-new"
          >
            What's New in Version {PSPDFKit.version} &rarr;
          </a>

          <div className="header__spacer" />

          <div className="header__ctas header__ctas--inline">
            <a
              className="header__cta"
              target="_blank"
              href="https://pspdfkit.com/try/"
            >
              Download Trial
            </a>

            <a
              className="header__cta header__cta--primary"
              target="_blank"
              href="https://pspdfkit.com/sales"
            >
              Contact Sales
            </a>
          </div>

          <button
            className={classes("header__example-button", {
              "header__example-button--active": showMobileSidebar
            })}
            onClick={this._toggleSidebar}
          >
            {this.state.switchedExample ? exampleData.title : "Choose Example"}
            <span className="header__example-button-chevron" />
          </button>

          <div className="header__overflow" onClick={this._handleOverflowClick}>
            ⋮
            <div
              className="header__overflow-contents"
              ref={this._overflowMenuRef}
            >
              <div className="header__overflow-ctas">
                <a
                  className="header__overflow-cta"
                  target="_blank"
                  href="https://pspdfkit.com/try/"
                  onClick={event => {
                    event.stopPropagation();
                    window.gtag("event", "Click Download Trial", {
                      event_category: "CTA",
                      event_label: "Web Catalog demo"
                    });
                  }}
                >
                  Download Trial
                </a>

                <a
                  className="header__overflow-cta header__overflow-cta--primary"
                  target="_blank"
                  href="https://pspdfkit.com/sales"
                  onClick={event => {
                    event.stopPropagation();
                    window.gtag("event", "Click Contact Sales", {
                      event_category: "CTA",
                      event_label: "Web Catalog demo"
                    });
                  }}
                >
                  Contact Sales
                </a>
              </div>

              <a
                href={blogPostUrlForVersion(PSPDFKit.version)}
                target="_blank"
                className="header__overflow-whats-new"
              >
                What's New in Version {PSPDFKit.version} &rarr;
              </a>

              {/* Used to prevent the iframe from swallowing clicks */}
              <div className="header__overflow-scrim" />
            </div>
          </div>
        </header>

        <div className="sidebar-with-viewer">
          <aside
            className={classes("sidebar", {
              "sidebar--open": showMobileSidebar
            })}
          >
            <div className="sidebar__top">
              <div
                className="sidebar__backend-area"
                data-backend={currentBackend}
              >
                <div
                  className="sidebar__backend-tabs"
                  onClick={this._handleTabClick}
                >
                  <div className="sidebar__backend-tab sidebar__backend-tab--standalone">
                    Standalone
                  </div>

                  <div className="sidebar__backend-tab sidebar__backend-tab--server">
                    Server
                  </div>
                </div>

                <div className="sidebar__backend-contents">
                  {isServer ? (
                    <>
                      <p>
                        Our Server Backend is pre-rendering PDFs for optimal
                        performance on all devices. It’s easy to deploy on your
                        own environment.
                      </p>
                      <InstantButton documentId={serverDocumentId} />
                    </>
                  ) : (
                    <>
                      <p>
                        The absence of a server component makes it easier to
                        integrate this solution and allows you to rapidly deploy
                        it into your existing website.{" "}
                        <a
                          href="https://codesandbox.io/s/github/PSPDFKit/pspdfkit-web-examples-catalog"
                          target="_blank"
                          onClick={e => {
                            e.stopPropagation();
                            window.gtag("event", "Opened in Codesandbox", {
                              event_category: "Web Catalog demo",
                              event_label: "Top Standalone Link to Codesandbox"
                            });
                          }}
                        >
                          Try in codesandbox.io
                        </a>
                      </p>
                      <StandaloneDocumentButton
                        showCustomPdf={this._showCustomStandalonePdf}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="sidebar__examples">
              <ExampleList
                currentExample={currentExample}
                switchExample={this._switchExample}
                currentBackend={currentBackend}
              />
            </div>
          </aside>
          <section
            className={classes("viewer", {
              "viewer--hidden": showMobileSidebar
            })}
            onClick={this._handleLayoutClick}
          >
            {children}
          </section>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            background: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
              sans-serif;
            color: #32383e;
            font-size: 13px;
            line-height: 1.5em;
            -ms-content-zooming: none;
          }

          p {
            margin: 0;
            padding: 0;
          }

          a {
            color: #267ad3;
          }

          a:hover {
            color: #23527c;
          }

          button {
            color: #3e464d;
            background: #eff1f5;
            border: none;
            border-radius: 5px;
            font-weight: 500;
            padding: 10px 15px;
            margin-top: 10px;
            cursor: pointer;
            background: #eff1f5;
            text-align: center;
            cursor: pointer;
            font-size: 12px;
          }
        `}</style>

        <style jsx>{`
          .layout {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
          }

          .header {
            width: 100%;
            display: flex;
            background: #32383e;
            justify-content: space-between;
            padding-left: 16px;
            height: 60px;
            flex-shrink: 0;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            z-index: 2;
          }

          .header__logo-anchor {
            display: flex;
            height: 100%;
            align-items: center;
          }

          .header__logo--light {
            display: none;
          }

          .header__logo--dark {
            display: none;
          }

          .header__logo {
            height: 30px;
          }

          .header__whats-new {
            color: #aaa;
            text-decoration: none;
            margin-left: 24px;

            display: none;
          }

          .header__spacer {
            flex: 1;
          }

          .header__example-button {
            margin: 0;
            padding: 0 14px;
            display: flex;
            align-items: center;
            height: 36px;
            background: #fff;
            color: #32383e;
          }

          .header__example-button--active {
            background: #8e949e;
          }

          .header__example-button-chevron {
            margin-left: 8px;
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;

            border-top: 5px solid #32383e;
          }

          .header__ctas {
            display: none;
          }

          .header__overflow-ctas {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .header__cta,
          .header__overflow-cta {
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            color: #5385dc;
            padding: 8px 24px;
            border-radius: 6px;
          }

          .header__overflow-cta {
            font-weight: normal;
            color: white;
            background: rgba(255, 255, 255, 0.05);
            width: 100%;
            text-align: center;
          }

          .header__cta--primary,
          .header__overflow-cta--primary {
            background: #5385dc;
            color: white;
          }

          .header__cta:not(:first-child) {
            margin-left: 8px;
          }

          .header__overflow-cta:not(:first-child) {
            margin-top: 8px;
          }

          .header__overflow {
            position: relative;
            width: 42px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            cursor: pointer;
          }

          .header__overflow-contents {
            position: absolute;
            top: 100%;
            right: 0;
            padding: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100vw;
            background: #32383e;
          }

          .header__overflow-scrim {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, 0.4);
          }

          .header__overflow-contents:not(.header__overflow-contents--shown) {
            display: none;
          }

          .header__overflow-whats-new {
            font-size: 12px;
            padding: 8px 0;
            width: 100%;
            margin-top: 8px;
            text-align: center;
            color: #5385dc;
          }

          .sidebar-with-viewer {
            display: flex;
            height: calc(100% - 60px);
          }

          .viewer {
            width: 100%;
          }

          .sidebar {
            display: none;
            flex-direction: column;
            background: #edf0f5;
            z-index: 1;
          }

          .sidebar--open {
            display: flex;
            width: 100%;
          }

          .sidebar__backend-tabs {
            display: flex;
            height: 38px;
          }

          .sidebar__backend-tab {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px 4px 0 0;
            width: 50%;
            font-weight: 500;
            cursor: pointer;
            opacity: 0.5;
          }

          .sidebar__backend-area[data-backend="server"]
            .sidebar__backend-tab--server,
          .sidebar__backend-area[data-backend="standalone"]
            .sidebar__backend-tab--standalone {
            opacity: 1;
            background: #edf0f5;
          }

          .sidebar__backend-contents {
            display: flex;
            flex-direction: column;
            padding: 16px;
            background: #edf0f5;
          }

          .sidebar__backend-area[data-backend="server"]
            .sidebar__backend-contents {
            border-radius: 4px 0 4px 4px;
          }

          .sidebar__backend-area[data-backend="standalone"]
            .sidebar__backend-contents {
            border-radius: 0 4px 4px 4px;
          }

          .sidebar__top {
            padding: 20px;
            background: #fff;
            border-bottom: 1px #eee solid;
            flex-shrink: 0;
          }

          .sidebar__backend-header {
            display: none;
          }

          .sidebar__backend-switcher {
            margin: 0;
          }

          .sidebar__examples {
            overflow-y: auto;
            padding: 20px;

            /*
            IE11 doesn't respect bottom padding here, so we'll allow the
            reset button to manage it's own padding
            */
            padding-bottom: 0;

            flex-grow: 1;
            -webkit-overflow-scrolling: touch;
          }

          .viewer--hidden {
            display: none;
          }

          @media (prefers-color-scheme: dark) {
            .sidebar {
              background: #222;
              color: white;
            }

            .sidebar__top {
              background: #222;
              border-bottom-color: rgba(255, 255, 255, 0.1);
            }

            .sidebar__backend-area[data-backend="server"]
              .sidebar__backend-tab--server,
            .sidebar__backend-area[data-backend="standalone"]
              .sidebar__backend-tab--standalone {
              background: #32373d;
            }

            .sidebar__backend-contents {
              background: #32373d;
            }

            .sidebar__backend-switcher {
              background: rgba(255, 255, 255, 0.1);
              color: white;
            }
          }

          @media (min-width: 370px) {
            .header__logo--small {
              display: none;
            }

            .header__logo--light {
              display: block;
            }

            .header {
              padding-left: 8px;
            }

            .header__logo {
              height: 30px;
            }
          }

          @media (min-width: 420px) {
            .header {
              padding-left: 16px;
            }

            .header__logo {
              height: 36px;
            }
          }

          @media (min-width: 992px) {
            .header {
              background: white;
              padding: 0 15px;
            }

            .header__logo {
              height: 42px;
            }

            .header__logo--light {
              display: none;
            }

            .header__logo--dark {
              display: block;
            }

            @media (prefers-color-scheme: dark) {
              .header {
                background: #32383e;
              }

              .header__logo--light {
                display: block;
              }

              .header__logo--dark {
                display: none;
              }
            }

            .header__whats-new {
              display: block;
            }

            .header__example-button {
              display: none;
            }

            .header__ctas {
              display: flex;
            }

            .header__overflow {
              display: none;
            }

            .sidebar {
              width: 380px;
              display: flex;
              box-shadow: 1px 0 rgba(0, 0, 0, 0.05);
              position: relative;
            }

            .sidebar__top {
              padding: 20px;
            }

            .sidebar__backend-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 16px;
            }

            .sidebar__examples {
              padding: 10px;
              padding-bottom: 0;
              overflow-y: auto;
            }

            .viewer {
              display: block;
              overflow: hidden;
              width: calc(100% - 380px);
              height: 100%;
            }
          }
        `}</style>
        <style jsx global>{`
          #__next {
            position: fixed;
            height: 100%;
            width: 100%;
          }
        `}</style>
      </div>
    );
  }
}

/**
 * Show the 'PSPDFKit for Web' version number in the header as a link to the
 * release blog post.
 *
 * Note: This presumes blog post urls follow the format:
 *
 * https://pspdfkit.com/blog/<YEAR>/pspdfkit-web-<MAJOR-VERSION>/
 *
 * Example: https://pspdfkit.com/blog/2017/pspdfkit-web-2017-6/
 */
function blogPostUrlForVersion(version) {
  const majorVersion = (version.match(/[0-9]{4}\.[0-9]{1,2}/) || [])[0];
  if (majorVersion) {
    const year = majorVersion.split(".")[0];
    const blogUrl = "https://pspdfkit.com/blog/";
    const postUrl =
      blogUrl + year + "/pspdfkit-web-" + majorVersion.replace(/\./g, "-");
    return postUrl;
  } else {
    return null;
  }
}
