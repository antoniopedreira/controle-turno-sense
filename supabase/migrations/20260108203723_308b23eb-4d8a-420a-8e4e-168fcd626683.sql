-- Criar política para permitir leitura pública na tabela controle_presenca
-- (base da view view_dashboard_didatico)
CREATE POLICY "Allow public read access to controle_presenca" 
ON public.controle_presenca 
FOR SELECT 
USING (true);