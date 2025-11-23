'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
    const supabase: SupabaseClient = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // In production, you might want to use useFormState or throw an error
        console.error('Login error:', error.message)
        redirect('/login')
    }

    revalidatePath('/', 'layout')
    redirect('/profile') // Redirect to profile after login
}

export async function signup(formData: FormData) {
    const supabase: SupabaseClient = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Optional: You can grab other fields here if your register form has them (username, etc..)
    // const username = formData.get('username') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // If you want email verification, change this url to your site
            emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
        }
    })

    if (error) {
        // In production, you might want to use useFormState or throw an error
        // For now, we'll just redirect to register page with error handling to be added
        console.error('Signup error:', error.message)
        redirect('/register')
    }

    revalidatePath('/', 'layout')
    redirect('/profile')
}