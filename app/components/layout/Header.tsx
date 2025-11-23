import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import HeaderUser from './HeaderUser';
import HeaderGuest from './HeaderGuest';

const Header = async () => {
    const session = await getServerSession(authOptions);

    if (session?.user) {
        return <HeaderUser />;
    }

    return <HeaderGuest />;
};

export default Header;
