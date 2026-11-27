# P6 Test

Prueba de artefactos del workspace.

## Imagen

![P6 test](./p6-test.png)

## Diagrama

```mermaid
flowchart LR
  A[Start] --> B{OK?}
  B -- yes --> C[Done]
  B -- no --> D[Retry]
  D --> B
```
