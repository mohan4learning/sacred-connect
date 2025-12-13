-- Create function to prevent non-admin users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed and the user is not an admin, reject
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Role changes are not permitted';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce role immutability
CREATE TRIGGER check_role_immutable
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();