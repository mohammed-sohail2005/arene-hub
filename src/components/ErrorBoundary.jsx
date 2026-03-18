import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorInfo: null, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo, error });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: 'red', padding: '20px', background: 'white', overflow: 'auto' }}>
                    <h1>React Render Crash!</h1>
                    <h2>{this.state.error?.toString()}</h2>
                    <pre style={{ color: 'black' }}>{this.state.errorInfo?.componentStack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
