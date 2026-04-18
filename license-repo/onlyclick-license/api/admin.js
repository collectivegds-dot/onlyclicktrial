const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { admin_password, action, email } = req.body;

    if (!admin_password || admin_password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, reason: 'Unauthorized: Invalid Admin Password' });
    }

    try {
        if (action === 'get_all') {
            const { data: allowed, error: allowedError } = await supabase.from('allowed_emails').select('*').order('created_at', { ascending: false });
            const { data: licenses, error: licError } = await supabase.from('licenses').select('*');
            
            if (allowedError || licError) throw new Error('Database Error');

            return res.status(200).json({ success: true, allowed, licenses });
        }

        if (action === 'add_email') {
            if (!email) return res.status(400).json({ success: false, reason: 'Email required' });
            const { error } = await supabase.from('allowed_emails').insert([{ email }]);
            if (error) return res.status(400).json({ success: false, reason: error.message });
            return res.status(200).json({ success: true, message: 'Email added successfully' });
        }

        if (action === 'reset_device') {
            if (!email) return res.status(400).json({ success: false, reason: 'Email required' });
            const { error } = await supabase.from('licenses').update({ device_fingerprint: null, device_name: null }).eq('email', email);
            if (error) return res.status(400).json({ success: false, reason: error.message });
            return res.status(200).json({ success: true, message: 'Device reset successfully' });
        }

        if (action === 'revoke') {
            if (!email) return res.status(400).json({ success: false, reason: 'Email required' });
            // Revoke license but keep in allowed just in case, or remove from both? We'll update status in licenses.
            const { error } = await supabase.from('licenses').update({ status: 'inactive' }).eq('email', email);
            if (error) return res.status(400).json({ success: false, reason: error.message });
            return res.status(200).json({ success: true, message: 'License deactivated' });
        }
        
        if (action === 're_activate') {
            if (!email) return res.status(400).json({ success: false, reason: 'Email required' });
            const { error } = await supabase.from('licenses').update({ status: 'active' }).eq('email', email);
            if (error) return res.status(400).json({ success: false, reason: error.message });
            return res.status(200).json({ success: true, message: 'License re-activated' });
        }

        return res.status(400).json({ success: false, reason: 'Unknown action' });

    } catch (err) {
        return res.status(500).json({ success: false, reason: 'Server error', details: err.message });
    }
};
