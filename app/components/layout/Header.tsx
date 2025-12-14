import React from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HeaderGuest from './HeaderGuest';
import HeaderAuthenticated from './HeaderAuthenticated';

const Header = async () => {
    const session = await getServerSession(authOptions);

    if (session?.user) {
        return <HeaderAuthenticated user={session.user} />;
    }

    return <HeaderGuest />;
};

export default Header;
