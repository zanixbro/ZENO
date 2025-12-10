import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { UserIcon } from '../components/icons';
import { LOGIN_SCREEN_DETAILS } from '../constants'; // Renamed import

interface LoginPageProps {
    setIsLoggedIn: (loggedIn: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsLoggedIn }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Mock authentication: accept any non-empty username/password
        if (username.trim() === '' || password.trim() === '') {
            setError('Please enter both username and password.');
            return;
        }

        // Simulate successful login
        setIsLoggedIn(true);
        // In a real app, you'd send credentials to a server and receive a token/session
        console.log('Mock login successful:', { username, password });
    };

    return (
        <Card title={LOGIN_SCREEN_DETAILS.title} description={LOGIN_SCREEN_DETAILS.description}>
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <UserIcon className="w-24 h-24 text-zeno-accent mb-6 opacity-60" />
                <h2 className="text-2xl font-semibold text-white mb-6">Welcome to Zeno!</h2>
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent border border-transparent focus:border-zeno-accent text-white"
                        aria-label="Username"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent border border-transparent focus:border-zeno-accent text-white"
                        aria-label="Password"
                    />
                    {error && <p className="text-zeno-danger text-sm">{error}</p>}
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                </form>
                <p className="text-sm text-zeno-muted mt-6">
                    This is a mock login for demonstration purposes. Any non-empty credentials will work!
                </p>
            </div>
        </Card>
    );
};

export default LoginPage;