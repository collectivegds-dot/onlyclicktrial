const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, fingerprint, email, deviceName } = req.body || req.query;

    if (!key) {
        return res.status(400).json({ valid: false, reason: 'invalid_license' });
    }

    try {
        const { data: license, error } = await supabase
            .from('licenses')
            .select(`*, allowed_emails!inner(email)`)
            .eq('license_key', key)
            .single();

        if (error || !license || license.status !== 'active') {
            return res.status(401).json({ valid: false, reason: 'invalid_license' });
        }

        // Check fingerprint
        if (license.device_fingerprint && license.device_fingerprint !== fingerprint) {
            return res.status(401).json({ valid: false, reason: 'device_mismatch' });
        }

        // Auto-bind device footprint if the license doesn't have one
        if (!license.device_fingerprint && fingerprint) {
            await supabase
                .from('licenses')
                .update({ device_fingerprint: fingerprint, device_name: deviceName || 'Unknown' })
                .eq('id', license.id);
        }

        // Update last used time
        await supabase
            .from('licenses')
            .update({ last_used: new Date().toISOString() })
            .eq('id', license.id);

        return res.status(200).json({
            valid: true,
            email: license.allowed_emails.email,
            plan: 'lifetime'
        });
    } catch (err) {
        return res.status(500).json({ valid: false, reason: 'server_error', details: err.message });
    }
};
