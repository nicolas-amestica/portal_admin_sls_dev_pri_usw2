export const APPROVED_PROGRAM = {
    dev: {
        title: "Giras Indómito DEV - Contrato Aprobado",
        subject: "Contrato Aprobado - Giras Indómito",
        body: (username, password) => `Su contrato ha sido aprobado exitosamente. Adjunto encontrará el documento PDF con los detalles del contrato.
            **Credenciales de Acceso al Portal:**
            Usuario: ${username}
            Contraseña temporal: ${password}
            Por favor, inicie sesión en nuestro portal <a href="https://d2q00w63koc9yz.cloudfront.net/auth/login">www.girasindomito.cl</a> y cambie su contraseña temporal por una de su preferencia.`
    },
    prd: {
        title: "Giras Indómito - Contrato Aprobado",
        subject: "Contrato Aprobado - Giras Indómito",
        body: (username, password) => `Su contrato ha sido aprobado exitosamente. Adjunto encontrará el documento PDF con los detalles del contrato.
            **Credenciales de Acceso al Portal:**
            Usuario: ${username}
            Contraseña temporal: ${password}
            Por favor, inicie sesión en nuestro portal <a href="https://d2e3zvke409odp.cloudfront.net/auth/login">www.girasindomito.cl</a> y cambie su contraseña temporal por una de su preferencia.`
    }
};
