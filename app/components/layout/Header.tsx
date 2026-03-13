import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import HeaderGuest from './HeaderGuest';
import HeaderAuthenticated from './HeaderAuthenticated';

const Header = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user) {
        return <HeaderAuthenticated user={session.user} />;
    }

    return <HeaderGuest />;
};

export default Header;
