# Worker PDF → DOCX (`api-tools-worker-py`)

Lambda **Python 3.12** (ARM64) que ejecuta [`pdf2docx`](https://github.com/pymupdf/pdf2docx/) para convertir PDFs subidos por el portal.

- **Sin HTTP:** solo invocación asíncrona desde `services/api-tools`.
- **Dependencias pesadas:** requiere `serverless-python-requirements` + Docker al empaquetar (`dockerizePip: true`).
- Configuración de plugin en [`common/custom.yml`](../../common/custom.yml) (`pythonRequirements`).

---

## Deploy manual (ejemplo dev)

Desde esta carpeta:

```bash
AWS_PROFILE=pa-dev npx sls deploy --stage dev --region us-west-2
```
