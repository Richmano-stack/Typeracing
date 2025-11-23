"use client"

import React from 'react';
import { useSession } from 'next-auth/react';

import HeaderUser from './HeaderUser';
import HeaderGuest from './HeaderGuest';

const HeaderWrapper: React.FC = () => {
    const { data: session, status } = useSession();
    const loading = status === "loading";
    const isLoggedIn = !!session;

    if (loading) {
        // Display a loading state while checking authentication
        return (
            <div className="h-16 flex items-center justify-center border-b">
                Checking Session...
            </div>
        );
    }
    return isLoggedIn ? <HeaderUser /> : <HeaderGuest />;
};

export default HeaderWrapper;