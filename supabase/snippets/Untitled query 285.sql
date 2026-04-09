-- Eliminar el disparador y la función que causan el choque con el frontend
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();