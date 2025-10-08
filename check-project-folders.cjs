#!/usr/bin/env node

/**
 * Script para verificar la estructura de carpetas de proyectos
 * Uso: node check-project-folders.js
 */

const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = 'uploads';
const PROJECTS_DIR = path.join(UPLOADS_DIR, 'projects');

console.log('🔍 Verificando estructura de carpetas de proyectos...\n');

// Check if uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  console.log('⚠️  El directorio "uploads" no existe.');
  console.log('📁 Creando directorio "uploads"...');
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('✅ Directorio "uploads" creado.\n');
}

// Check if projects directory exists
if (!fs.existsSync(PROJECTS_DIR)) {
  console.log('⚠️  El directorio "uploads/projects" no existe.');
  console.log('📁 Creando directorio "uploads/projects"...');
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  console.log('✅ Directorio "uploads/projects" creado.\n');
}

console.log('📂 Estructura actual en uploads/projects:\n');

// Read directory contents
const items = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });

if (items.length === 0) {
  console.log('   (vacío - no hay archivos ni carpetas)\n');
} else {
  let fileCount = 0;
  let folderCount = 0;
  let filesInRoot = [];
  let projectFolders = [];

  items.forEach(item => {
    if (item.isDirectory()) {
      folderCount++;
      const folderPath = path.join(PROJECTS_DIR, item.name);
      const folderContents = fs.readdirSync(folderPath);

      projectFolders.push({
        name: item.name,
        fileCount: folderContents.length,
        files: folderContents
      });

      console.log(`   📁 ${item.name}/ (${folderContents.length} archivo${folderContents.length !== 1 ? 's' : ''})`);
      folderContents.forEach(file => {
        console.log(`      └─ ${file}`);
      });
    } else {
      fileCount++;
      filesInRoot.push(item.name);
      console.log(`   ⚠️  ${item.name} (archivo suelto - debería estar en una carpeta de proyecto)`);
    }
  });

  console.log('\n📊 Resumen:');
  console.log(`   - Carpetas de proyectos: ${folderCount}`);
  console.log(`   - Archivos sueltos (incorrectos): ${fileCount}`);

  if (fileCount > 0) {
    console.log('\n⚠️  PROBLEMA DETECTADO:');
    console.log('   Hay archivos sueltos en uploads/projects/ que deberían estar organizados en carpetas.');
    console.log('\n💡 Solución:');
    console.log('   1. Identifica a qué proyecto pertenece cada archivo');
    console.log('   2. Crea una carpeta con el nombre del proyecto (sin espacios ni caracteres especiales)');
    console.log('   3. Mueve los archivos a la carpeta correspondiente');
    console.log('\n   Archivos sueltos encontrados:');
    filesInRoot.forEach(file => {
      console.log(`      - ${file}`);
    });
  } else if (folderCount > 0) {
    console.log('\n✅ Estructura correcta! Todos los archivos están organizados en carpetas de proyectos.');
  }
}

console.log('\n' + '='.repeat(80));
console.log('ℹ️  Información Importante:\n');
console.log('   La estructura correcta debe ser:');
console.log('   uploads/projects/[NombreDelProyecto]/archivo.xlsx\n');
console.log('   Ejemplo:');
console.log('   uploads/projects/Migracion_Datacenter_Madrid/project_1234_plan.xlsx');
console.log('   uploads/projects/Migracion_Datacenter_Madrid/equipment_5678_foto.jpg\n');
console.log('   Con las nuevas validaciones implementadas, el sistema ahora:');
console.log('   ✓ Requiere que ingreses el nombre del proyecto ANTES de subir archivos');
console.log('   ✓ Valida que el nombre tenga al menos 3 caracteres');
console.log('   ✓ Crea automáticamente la carpeta del proyecto');
console.log('   ✓ Organiza todos los archivos dentro de esa carpeta\n');
console.log('='.repeat(80) + '\n');
