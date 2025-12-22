import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const envStatus = {
      url: {
        configured: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
        full: supabaseUrl || 'NOT SET'
      },
      key: {
        configured: !!supabaseKey,
        value: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET',
        type: supabaseKey ? (supabaseKey.startsWith('sb_publishable_') ? 'publishable' : 'anon') : 'none'
      }
    };

    // Test connection
    let connectionTest = {
      success: false,
      error: null as string | null,
      usersCount: 0
    };

    if (supabaseUrl && supabaseKey) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true });
        
        if (error) {
          connectionTest.error = error.message;
        } else {
          connectionTest.success = true;
          connectionTest.usersCount = data?.length || 0;
        }
      } catch (err: any) {
        connectionTest.error = err.message || 'Unknown error';
      }
    } else {
      connectionTest.error = 'Environment variables not configured';
    }

    // Try to get admin user
    let adminUser = null;
    if (supabaseUrl && supabaseKey) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, full_name, role')
          .eq('username', 'admin')
          .single();
        
        if (!error && data) {
          adminUser = data;
        }
      } catch (err) {
        // Ignore
      }
    }

    return NextResponse.json({
      environment: envStatus,
      connection: connectionTest,
      adminUser,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
