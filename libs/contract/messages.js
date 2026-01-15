export const APPROVED_PROGRAM = {
    dev: {
        title: "Contrato Aprobado",
        subject: "¡Felicitaciones! Su Contrato ha sido Aprobado - Giras Indómito",
        body: (username, password) => `¡Nos complace informarle que su contrato ha sido aprobado exitosamente!

Adjunto a este correo encontrará el documento PDF con todos los detalles de su contrato.

<div class="credentials-box">
    <h3>🔐 Credenciales de Acceso al Portal</h3>
    <div class="credential-item">
        <span class="credential-label">Usuario:</span>
        <span class="credential-value">${username}</span>
    </div>
    <div class="credential-item">
        <span class="credential-label">Contraseña:</span>
        <span class="credential-value">${password}</span>
    </div>
</div>

<strong>Próximos pasos:</strong>
1. Acceda a nuestro portal usando el botón de abajo.
2. Ingrese con las credenciales proporcionadas.
3. Por seguridad, cambie su contraseña temporal por una de su preferencia.
4. Explore las funcionalidades disponibles para gestionar su programa.

Estamos emocionados de acompañarle en esta experiencia inolvidable.`
    },
    prd: {
        title: "Contrato Aprobado",
        subject: "¡Felicitaciones! Su Contrato ha sido Aprobado - Giras Indómito",
        body: (username, password) => `¡Nos complace informarle que su contrato ha sido aprobado exitosamente!

Adjunto a este correo encontrará el documento PDF con todos los detalles de su contrato.

<div class="credentials-box">
    <h3>🔐 Credenciales de Acceso al Portal</h3>
    <div class="credential-item">
        <span class="credential-label">Usuario:</span>
        <span class="credential-value">${username}</span>
    </div>
    <div class="credential-item">
        <span class="credential-label">Contraseña:</span>
        <span class="credential-value">${password}</span>
    </div>
</div>

<strong>Próximos pasos:</strong>
1. Acceda a nuestro portal usando el botón de abajo.
2. Ingrese con las credenciales proporcionadas.
3. Por seguridad, cambie su contraseña temporal por una de su preferencia.
4. Explore las funcionalidades disponibles para gestionar su programa.

Estamos emocionados de acompañarle en esta experiencia inolvidable.`
    }
};
