SELECT 
    p.id,
    p.nombres,
    p.apellido_paterno,
    p.telefono,
    d.ci,
    d.profesion
FROM public.perfiles p
LEFT JOIN public.detalles_cliente d ON p.id = d.perfil_id
WHERE p.rol = 'cliente'
ORDER BY p.creado_en DESC
LIMIT 5;