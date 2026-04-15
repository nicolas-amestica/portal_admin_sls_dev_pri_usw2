package notification

// SendRequest es el payload de entrada para enviar una notificación.
type SendRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Message string `json:"message"`
	Preview string `json:"preview"`
	SK      string `json:"sk"`
}

// SendResponse es la respuesta exitosa del handler.
type SendResponse struct {
	Message   string `json:"message"`
	Recipient string `json:"recipient"`
}

// ContractFile representa un archivo PDF del contrato almacenado en S3.
type ContractFile struct {
	Bucket      string `dynamodbav:"bucket"`
	Key         string `dynamodbav:"Key"`
	Path        string `dynamodbav:"path"`
	Type        string `dynamodbav:"type"`
	Description string `dynamodbav:"description"`
	UploadDate  string `dynamodbav:"uploadDate"`
}

// Contract contiene los archivos del contrato dentro del content del programa.
// Soporta el formato nuevo (files[]) y el antiguo (file singular).
type Contract struct {
	Files []ContractFile `dynamodbav:"files"`
	File  *ContractFile  `dynamodbav:"file"`
}

// ContentItem representa un elemento dentro del array content del programa.
type ContentItem struct {
	Contract Contract `dynamodbav:"contract"`
}

// ProgramItem representa el item del programa en DynamoDB (sólo los campos necesarios).
type ProgramItem struct {
	PK      string        `dynamodbav:"pk"`
	SK      string        `dynamodbav:"sk"`
	Content []ContentItem `dynamodbav:"content"`
}

// AttachedPDF es un PDF descargado desde S3 listo para adjuntar al email.
type AttachedPDF struct {
	Filename string
	Data     []byte
}

// EmailConfig son las credenciales SMTP obtenidas desde SSM Parameter Store.
type EmailConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Secure   bool   `json:"secure"`
	User     string `json:"user"`
	Password string `json:"password"`
}

// emailContent agrupa subject y body HTML según el tipo de notificación.
type emailContent struct {
	Subject string
	BodyHTML string
}
