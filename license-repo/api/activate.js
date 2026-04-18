const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, reason: 'Email is required.' });
    }

    try {
        // Check if email is allowed
        const { data: allowedEmail, error: allowedError } = await supabase
            .from('allowed_emails')
            .select('*')
            .eq('email', email)
            .single();

        if (allowedError || !allowedEmail) {
            return res.status(403).json({ success: false, reason: 'Maaf, email ini belum terdaftar oleh admin.' });
        }

        // Check if user already has a license
        const { data: existingLicense, error: licenseError } = await supabase
            .from('licenses')
            .select('*')
            .eq('email', email)
            .single();

        if (existingLicense) {
            if (existingLicense.status !== 'active') {
                return res.status(403).json({ success: false, reason: 'Lisensi Anda telah dinonaktifkan.' });
            }
            // Return existing license key
            return res.status(200).json({ success: true, key: existingLicense.license_key });
        }

        // Generate new license key
        const newKey = 'OC-' + uuidv4().split('-')[0].toUpperCase() + '-' + uuidv4().split('-')[1].toUpperCase();

        const { data: insertData, error: insertError } = await supabase
            .from('licenses')
            .insert([{ email, license_key: newKey }])
            .select()
            .single();

        if (insertError) {
            return res.status(500).json({ success: false, reason: 'Gagal membuat lisensi.', details: insertError.message });
        }

        return res.status(200).json({ success: true, key: insertData.license_key });

    } catch (err) {
        return res.status(500).json({ success: false, reason: 'Server error.', details: err.message });
    }
};
