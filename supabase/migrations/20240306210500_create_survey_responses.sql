-- Create the survey_responses table
create table if not exists survey_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primeira_vez text,
  idade text,
  tempo_atuacao text,
  renda_agricultura text,
  produtos text,
  locais_venda text[],
  divulga_redes text,
  controla_financas text,
  dificuldades text[],
  conciliar_familia text,
  temas_aprender text[],
  sugestao text
);

-- Enable Row Level Security
alter table survey_responses enable row level security;

-- Create policy to allow anyone to insert (public survey)
create policy "Allow public insert" on survey_responses for insert with check (true);

-- Create policy to allow authenticated users to read (optional, for admin)
create policy "Allow authenticated read" on survey_responses for select using (auth.role() = 'authenticated');
