import { styled } from "linaria/react";
import React, { ErrorInfo } from "react";

import { warn, isDefined } from "@app/utility";
import Spinner from "@architus/facade/components/Spinner";
import { color } from "@architus/facade/theme/color";
import { scrollBarAuto } from "@architus/facade/theme/mixins";
import { gap } from "@architus/facade/theme/spacing";
import { font } from "@architus/facade/theme/typography";
import { Option, Some, None } from "@architus/lib/option";

const Styled = {
  FallbackRenderer: styled.div`
    position: relative;
    height: 100%;
    display: block;
  `,
  ErrorWrapper: styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    color: ${color("textStrong")};
    padding: ${gap.milli};
    z-index: 10;
    background-color: ${color("modalOverlay")};

    overflow-x: hide;
    overflow-y: auto;
    ${scrollBarAuto()}

    & :not(pre) > code {
      color: ${color("primary")};
      display: inline-block;
      background-color: ${color("bg+10")};
      border-radius: 4px;
      font-family: ${font("monospace")};
      padding: 0.1em 0.35em 0.05em;
      font-size: 100%;
    }

    & p {
      color: ${color("text")};
      margin-bottom: ${gap.pico};
    }

    & h2 {
      font-size: 3rem;
      font-weight: 200;
      margin-bottom: ${gap.nano};
    }

    & h3 {
      font-size: 1.5rem;
      margin-bottom: ${gap.pico};
    }

    & h4 {
      font-size: 1.25rem;
      margin-bottom: ${gap.pico};
    }
  `,
  Divider: styled.hr`
    border-top: 1px solid ${color("textLight")};
  `,
  ErrorDetails: styled.article`
    pre {
      color: ${color("text")};
      margin-bottom: ${gap.pico};
      background-color: ${color("bg+10")};
      border-radius: 4px;
      padding: ${gap.nano};
      margin-top: ${gap.pico};

      overflow: auto;
      ${scrollBarAuto()}
    }

    & p {
      margin-bottom: ${gap.pico};

      strong {
        font-weight: 400;
        color: ${color("textStrong")};
      }
    }
  `,
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Option<Error>;
  info: Option<ErrorInfo>;
};

/**
 * Wraps errors in the component tree, hiding their effects so the rest of the application
 * can continue running
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: None, info: None };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error: Some(error), info: None };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    warn(
      "An error ocurred in the render tree and was " +
        "caught in an <ErrorBoundary /> component"
    );
    warn(error, info);
    if (isDefined(this.props.onError)) this.props.onError(error, info);
    this.setState({ info: Some(info) });
  }

  render(): React.ReactElement | null {
    const { error, info } = this.state;
    if (error.isDefined()) {
      const { fallback } = this.props;
      return <FallbackRenderer error={error} info={info} fallback={fallback} />;
    }

    return <>{this.props.children}</>;
  }
}

export default ErrorBoundary;

// ? ==============
// ? Sub components
// ? ==============

type FallbackRendererProps = Pick<ErrorBoundaryProps, "fallback"> & {
  error: Option<Error>;
  info: Option<ErrorInfo>;
};

/**
 * Renders the fallback if given in production, and displays more detailed error info
 * on development
 */
const FallbackRenderer: React.FC<FallbackRendererProps> = ({
  error,
  info,
  fallback,
}) => {
  if (process.env.NODE_ENV !== "production") {
    return (
      <Styled.FallbackRenderer>
        {fallback}
        <Styled.ErrorWrapper>
          <h2>An error occurred</h2>
          <h3>&lt;ErrorBoundary/&gt;</h3>
          <p>
            An error ocurred beneath this component in the component tree. This
            error boundary will catch errors and prevent them from crashing the
            entire application. To control the fallback, set the{" "}
            <code>fallback</code> prop on the corresponding{" "}
            <code>&lt;ErrorBoundary/&gt;</code> component
          </p>
          <p>
            <em>This message is hidden in production.</em>
          </p>
          <Styled.Divider />
          <h3>Error details</h3>
          {error.match({
            None: () => (
              <p>No details were available for this error. Check the console</p>
            ),
            Some: (errorInner) => (
              <Styled.ErrorDetails>
                <p>
                  <strong>Name</strong>: <code>{errorInner?.name}</code>
                </p>
                <p>
                  <strong>Message</strong>: {errorInner?.message}
                </p>
                <p>
                  <strong>Stacktrace</strong>:{" "}
                  <pre>
                    <code>{Option.from(errorInner?.stack).getOrElse("~")}</code>
                  </pre>
                </p>
              </Styled.ErrorDetails>
            ),
          })}
          <Styled.ErrorDetails>
            <p>
              <strong>Component stack</strong>:{" "}
              {info.match({
                None: () => <Spinner variant="primary" size="32px" />,
                Some: (infoInner) => (
                  <pre>
                    <code>{infoInner.componentStack}</code>
                  </pre>
                ),
              })}
            </p>
          </Styled.ErrorDetails>
        </Styled.ErrorWrapper>
      </Styled.FallbackRenderer>
    );
  }

  return <>{fallback}</>;
};
