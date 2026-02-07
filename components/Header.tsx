import React from 'react';
import { Layout } from './Layout';

interface HeaderProps {
    userName: string;
    onUserChange: (name: string) => void;
    onShare: () => void;
    children: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ userName, onUserChange, onShare, children }) => {
    return (
        <Layout userName={userName} onUserChange={onUserChange} onShare={onShare}>
            {children}
        </Layout>
    );
};
