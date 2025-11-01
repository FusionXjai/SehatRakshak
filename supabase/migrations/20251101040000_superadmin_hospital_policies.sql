-- Allow super admins to manage hospitals
CREATE POLICY "Superadmins can insert hospitals"
ON public.hospitals FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update hospitals"
ON public.hospitals FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete hospitals"
ON public.hospitals FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));
