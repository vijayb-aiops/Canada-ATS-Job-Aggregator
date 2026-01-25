BEGIN;

-- Create scans table to track scan history and status
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    ats_filters TEXT[] NOT NULL,
    role_filters TEXT[] NOT NULL,
    total_found INTEGER DEFAULT 0,
    error_message TEXT
);

-- Create jobs table to store aggregated job postings
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
    ats_system TEXT NOT NULL,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    link TEXT NOT NULL,
    location TEXT,
    job_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies (Allowing public access for this internal tool as per requirements, 
-- but in a production app we would restrict this to authenticated users)
CREATE POLICY "Allow public read access on scans" ON public.scans FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on scans" ON public.scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on scans" ON public.scans FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on jobs" ON public.jobs FOR INSERT WITH CHECK (true);

COMMIT;