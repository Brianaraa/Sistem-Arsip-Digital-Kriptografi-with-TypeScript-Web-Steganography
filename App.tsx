
import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import { AuthMethod } from './types';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [authMethod, setAuthMethod] = useState<AuthMethod>('PASSWORD');

    const handleLoginSuccess = (user: string, method: AuthMethod) => {
        setUsername(user);
        setAuthMethod(method);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setUsername('');
        setIsAuthenticated(false);
    };

    return (
        <div className="min-h-screen bg-primary">
            {isAuthenticated ? (
                <MainApp username={username} authMethod={authMethod} onLogout={handleLogout} />
            ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
};

export default App;
