# Instalar extensión MediBill RMV en Chrome

Sigue estos pasos para activar el autorrelleno del formulario de e-Misión.

---

## Paso 1 — Abrir la página de extensiones

1. Abre **Google Chrome**.
2. En la barra de direcciones escribe: `chrome://extensions`
3. Presiona **Enter**.

---

## Paso 2 — Activar el modo desarrollador

En la esquina superior derecha de la página encontrarás un interruptor que dice
**"Modo de desarrollador"** (Developer mode).

Actívalo (debe quedar en azul / encendido).

---

## Paso 3 — Cargar la extensión

1. Aparecerán tres botones nuevos en la parte superior izquierda.
2. Haz clic en **"Cargar sin empaquetar"** (_Load unpacked_).
3. Se abrirá un selector de carpetas.
4. Navega hasta la carpeta del proyecto: `medibill-rmv/extension/`
5. Selecciona esa carpeta y haz clic en **"Seleccionar"** (o **"Abrir"**).

La extensión aparecerá en la lista con el nombre **"MediBill RMV — Emisión Autofill"**.

---

## Paso 4 — Copiar el ID de la extensión

Debajo del nombre de la extensión verás una línea con texto como:

```
ID: abcdefghijklmnopqrstuvwxyzabcdef
```

Copia ese ID completo (32 caracteres).

---

## Paso 5 — Registrar el ID en la aplicación

1. Abre el archivo `src/screens/Success.jsx` en tu editor de código.
2. Busca la línea:
   ```javascript
   const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'
   ```
3. Reemplaza `'YOUR_EXTENSION_ID_HERE'` con el ID que copiaste:
   ```javascript
   const EXTENSION_ID = 'abcdefghijklmnopqrstuvwxyzabcdef'
   ```
4. Guarda el archivo.
5. Reconstruye y vuelve a desplegar la aplicación:
   ```bash
   npm run build
   ```
   Luego despliega a Vercel como de costumbre.

---

## Paso 6 — Verificar que funciona

1. En MediBill, aprueba un paciente. En la pantalla de confirmación aparecerá el
   botón **"Enviar a emisión"**.
2. Tócalo. Deberías ver el mensaje: **"Agregado a la cola de e-Misión"**.
3. Abre la extensión (ícono en la barra de Chrome) — el paciente aparecerá en la lista.
4. Haz clic en **"Ir a e-Misión"**. El formulario de cliente se abrirá.
5. Haz clic en el botón flotante **"Cargar paciente ▶"** en la esquina inferior derecha.
6. Los campos se rellenan automáticamente. Revisa, ajusta si es necesario, y guarda.

---

## Notas

- La extensión solo funciona en **Google Chrome** (no Firefox ni Safari).
- Si el botón "Enviar a emisión" no encuentra la extensión, copia los datos al
  portapapeles como respaldo — el mensaje lo indicará.
- Si los campos no se rellenan correctamente, los selectores CSS pueden necesitar
  ajuste. Abre `extension/content.js` y actualiza el objeto `SEL` con los
  `name` o `id` reales del formulario de e-Misión (inspecciónalo con DevTools).
- Cada vez que se actualice la carpeta `extension/`, recarga la extensión en
  `chrome://extensions` haciendo clic en el ícono de actualizar (↺) de la tarjeta.
