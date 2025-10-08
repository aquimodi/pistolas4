# Actualización: Organización de Archivos por Proyecto

## Cambios Implementados

Se ha modificado el sistema de almacenamiento de archivos para organizarlos por proyecto. Ahora todos los archivos (Excel de proyectos, PDFs de albaranes, fotos de equipos, etc.) se guardan en carpetas específicas de cada proyecto.

## Nueva Estructura de Directorios

```
/uploads/projects/[Nombre del Proyecto]/
  ├── project_[timestamp]_[nombre].xlsx     (Archivos Excel del proyecto)
  ├── delivery_note_[timestamp]_[nombre].pdf (PDFs de albaranes)
  ├── equipment_[timestamp]_[nombre].jpg     (Fotos de evidencias)
  └── ... (todos los archivos relacionados con el proyecto)
```

### Ejemplo:
```
/uploads/projects/Migracion_Datacenter_Madrid/
  ├── project_1234567890_plan.xlsx
  ├── delivery_note_1234567891_albaran_001.pdf
  ├── equipment_1234567892_server_A1.jpg
  └── equipment_1234567893_switch_B2.jpg
```

## Archivos Modificados

### Backend

#### 1. `server/routes/upload.js`
**Cambios principales:**
- Añadida función `sanitizeProjectName()` para limpiar nombres de proyecto y crear directorios válidos
- Modificado `multer.diskStorage` para:
  - Requerir `project_name` en todas las subidas de archivos
  - Crear directorios automáticamente: `/uploads/projects/[ProjectName]/`
  - Generar rutas públicas consistentes: `/uploads/projects/[ProjectName]/[filename]`
- Actualizado todos los endpoints de upload (`/projects`, `/delivery_notes`, `/equipment`) para:
  - Recibir y validar `project_name`
  - Registrar el nombre del proyecto en logs
  - Retornar la ruta completa con el nombre del proyecto

**Características de seguridad:**
- Sanitización de nombres de proyecto (elimina caracteres especiales)
- Límite de 100 caracteres para nombres de carpeta
- Validación de existencia de `project_name`

### Frontend

#### 2. `src/components/FileUpload.tsx`
**Cambios:**
- Añadido prop obligatorio `projectName: string`
- El componente ahora envía `project_name` en el FormData junto con el archivo
- Se mantiene compatibilidad con todos los tipos de upload (projects, delivery_notes, equipment)

#### 3. `src/components/ProjectModal.tsx`
**Cambios:**
- Actualizado `<FileUpload>` para pasar `projectName={formData.project_name}`
- Se aplica tanto para subida inicial como para cambio de archivo

#### 4. `src/components/DeliveryNoteModal.tsx`
**Cambios:**
- Añadido prop `projectName: string` a la interfaz
- Actualizado `<FileUpload>` para pasar `projectName={projectName}`
- El proyecto se obtiene del pedido relacionado

#### 5. `src/components/EquipmentModal.tsx`
**Cambios:**
- Añadido prop `projectName: string` a la interfaz
- Actualizado `<FileUpload>` para pasar `projectName={projectName}`
- Se usa para fotos de verificación de equipos

#### 6. `src/pages/DeliveryNotesPage.tsx`
**Cambios:**
- Modificado para obtener el nombre del proyecto desde el pedido
- Pasa `projectName` al `DeliveryNoteModal`
- Usa 'Unknown_Project' como fallback si no se encuentra el proyecto

#### 7. `src/pages/EquipmentPage.tsx`
**Cambios:**
- Modificado para obtener el nombre del proyecto desde `currentProject`
- Pasa `projectName` al `EquipmentModal`
- Usa 'Unknown_Project' como fallback si no se encuentra el proyecto

## Comportamiento

### Creación de Carpetas
- Las carpetas se crean automáticamente cuando se sube el primer archivo
- Si la carpeta ya existe, simplemente se añaden los nuevos archivos
- Los nombres se sanitizan para evitar problemas de sistema de archivos

### Nombres de Carpeta
Los nombres de proyecto se transforman así:
- Espacios → Guiones bajos (`_`)
- Caracteres especiales → Guiones bajos (`_`)
- Se eliminan caracteres inválidos: `< > : " / \ | ? *`
- Máximo 100 caracteres

**Ejemplos:**
- "Migración Datacenter Madrid" → `Migracion_Datacenter_Madrid`
- "Proyecto 2024 - Cliente ABC" → `Proyecto_2024___Cliente_ABC`
- "Test / Prueba: Demo" → `Test___Prueba__Demo`

### Validación
- **Backend:** Rechaza uploads sin `project_name` con error HTTP 400
- **Frontend:** Requiere `projectName` como prop obligatorio en FileUpload
- **Logs:** Todos los uploads registran el proyecto asociado para auditoría

## Beneficios

1. **Organización Mejorada:** Todos los archivos de un proyecto en una única ubicación
2. **Facilidad de Búsqueda:** Localizar archivos por nombre de proyecto
3. **Gestión Simplificada:** Backup/restore/eliminación por proyecto completo
4. **Auditoría:** Logs detallados muestran qué archivos pertenecen a qué proyecto
5. **Escalabilidad:** Sistema preparado para cientos de proyectos

## Compatibilidad

- ✅ Archivos existentes en la estructura antigua seguirán funcionando
- ✅ Los nuevos archivos usarán automáticamente la nueva estructura
- ✅ Las rutas de archivo almacenadas en la base de datos mantienen la ruta completa
- ✅ FileViewer funciona con ambas estructuras de ruta

## Testing

El proyecto compila correctamente:
```
✓ built in 3.79s
```

## Notas Importantes

1. **Migración de Archivos Existentes:** Los archivos antiguos no se migran automáticamente. Si es necesario, se puede crear un script de migración.

2. **Base de Datos:** Las rutas en la base de datos ahora incluyen el nombre del proyecto:
   - Antes: `/uploads/projects/archivo.xlsx`
   - Ahora: `/uploads/projects/Nombre_Proyecto/archivo.xlsx`

3. **Permisos:** Asegurarse de que el servidor tiene permisos de escritura en `/uploads/projects/`

4. **Backups:** Considerar hacer backup del directorio `/uploads/` antes de usar en producción.
