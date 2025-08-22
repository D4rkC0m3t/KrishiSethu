// Quick finder for a user email across Supabase tables (profiles, users)
// Usage: node scripts/find-user-by-email.js "email@example.com"

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

(async () => {
	const { createClient } = await import('@supabase/supabase-js');

	const email = process.argv[2];
	if (!email) {
		console.error('Usage: node scripts/find-user-by-email.js "email@example.com"');
		process.exit(1);
	}

	const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://srhfccodjurgnuvuqynp.supabase.co';
	// Prefer service role for server-side lookup to bypass RLS if provided
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
	const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaGZjY29kanVyZ251dnVxeW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU0NzksImV4cCI6MjA3MDkyMTQ3OX0.emNVb99D7c6K8CKYqkdDTzKr3Ly6mErKEFMEGbIDN8A';
	const supabaseKey = serviceKey || anonKey;

	const supabase = createClient(supabaseUrl, supabaseKey, {
		auth: { autoRefreshToken: true, persistSession: false, detectSessionInUrl: false }
	});

	console.log(`\n🔎 Searching for email: ${email}`);
	console.log(`🌐 Project: ${supabaseUrl}`);
	console.log(serviceKey ? '🔐 Using SERVICE ROLE key (RLS bypass)' : '🟢 Using anon key (RLS enforced)');

	async function findInProfiles() {
		try {
			// First, try with nested relation if available
			let { data, error } = await supabase
				.from('profiles')
				.select(`
					id, email, name, role, is_active, is_paid,
					trial_start, trial_end, trial_start_date, trial_end_date,
					created_at, updated_at,
					user_subscriptions ( id, is_active, plan_id, start_date, end_date, amount_paid )
				`)
				.ilike('email', email)
				.limit(5);

			// If relation/columns do not exist, retry with minimal columns
			if (error && (error.code === '42703' || error.code === '42P01' || /column|relation/i.test(error.message))) {
				const fallback = await supabase
					.from('profiles')
					.select('id, email, name, role, is_active, is_paid, trial_end, trial_end_date, created_at, updated_at')
					.ilike('email', email)
					.limit(5);
				data = fallback.data; error = fallback.error;
			}

			if (error) return { error };
			return { data: data || [] };
		} catch (err) {
			return { error: err };
		}
	}

	async function findInUsers() {
		try {
			let { data, error } = await supabase
				.from('users')
				.select('id, email, name, role, is_active, is_paid, trial_end, trial_end_date, created_at, updated_at')
				.ilike('email', email)
				.limit(5);

			if (error) return { error };
			return { data: data || [] };
		} catch (err) {
			return { error: err };
		}
	}

	function printRows(label, rows) {
		if (!rows || rows.length === 0) {
			console.log(`\n${label}: 0 rows`);
			return;
		}
		console.log(`\n${label}: ${rows.length} row(s)`);
		for (const r of rows) {
			const trialEnd = r.trial_end_date || r.trial_end || null;
			console.log({
				id: r.id,
				email: r.email,
				name: r.name || r.full_name,
				role: r.role || r.account_type,
				is_active: r.is_active,
				is_paid: r.is_paid,
				trial_end: trialEnd,
				created_at: r.created_at
			});
		}
	}

	const prof = await findInProfiles();
	if (prof.error) {
		console.log('\nprofiles lookup error:', prof.error.message || prof.error);
	} else {
		printRows('profiles', prof.data);
	}

	const users = await findInUsers();
	if (users.error) {
		console.log('\nusers lookup error:', users.error.message || users.error);
	} else {
		printRows('users', users.data);
	}

	if ((prof.data || []).length === 0 && (users.data || []).length === 0) {
		console.log('\n⚠️ No visible rows for this email. If you expect results, Row Level Security may be restricting reads. Try with a service role key or verify RLS policies.');
	}

	process.exit(0);
})();


