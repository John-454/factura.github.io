// Configuración de la compañía
const companyInfo = {
    name: 'JohAn \nArte manual',
    address: 'Calle 15# 6N 30 \nBarrio Totoral \nIpiales - Nariño',
    phone: '315 288 3942',
    logo: 'assets/Logo.png'
};

// Estado de la aplicación
let products = [];
let editingProductId = null;

// Elementos DOM
const productModal = document.getElementById('productModal');
const productsTableBody = document.getElementById('productsTableBody');
const precioFinalSpan = document.getElementById('precioFinal');

// Event Listeners
document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
document.getElementById('cancelModalBtn').addEventListener('click', closeProductModal);
document.getElementById('saveModalBtn').addEventListener('click', saveProduct);
document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);

// Inicialización
document.getElementById('invoiceDate').valueAsDate = new Date();

// Funciones principales
function openProductModal(product = null) {
    editingProductId = product ? product.id : null;
    document.getElementById('modalTitle').textContent = product ? 'Editar Producto' : 'Nuevo Producto';
    document.getElementById('quantity').value = product ? product.quantity : '';
    document.getElementById('description').value = product ? product.description : '';
    document.getElementById('unitPrice').value = product ? product.unitPrice : '';
    productModal.style.display = 'block';
}

function closeProductModal() {
    productModal.style.display = 'none';
    editingProductId = null;
}

function saveProduct() {
    const quantity = Number(document.getElementById('quantity').value);
    const description = document.getElementById('description').value;
    const unitPrice = Number(document.getElementById('unitPrice').value);

    if (!quantity || !description || !unitPrice) {
        alert('Por favor, complete todos los campos');
        return;
    }

    const product = {
        id: editingProductId || Date.now(),
        quantity,
        description,
        unitPrice,
        totalPrice: quantity * unitPrice
    };

    if (editingProductId) {
        const index = products.findIndex(p => p.id === editingProductId);
        products[index] = product;
    } else {
        products.push(product);
    }

    updateProductsTable();
    closeProductModal();
}

function updateProductsTable() {
    productsTableBody.innerHTML = '';
    let precioFinal = 0;

    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.quantity}</td>
            <td>${product.description}</td>
            <td>$${product.unitPrice.toFixed(2)}</td>
            <td>$${product.totalPrice.toFixed(2)}</td>
            <td>
                <button class="btn edit-btn" data-index="${index}">Editar</button>
                <button class="btn delete-btn" data-id="${product.id}">Eliminar</button>
            </td>
        `;

        // Agregar event listeners a los botones
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => openProductModal(products[index]));
        deleteBtn.addEventListener('click', () => deleteProduct(product.id));

        productsTableBody.appendChild(row);
        precioFinal += product.totalPrice;
    });

    precioFinalSpan.textContent = precioFinal.toFixed(2);
}

function deleteProduct(id) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        products = products.filter(p => p.id !== id);
        updateProductsTable();
    }
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone:'UTC'
    });
}

// Función para convertir imagen a Base64
function getBase64Image(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';  // Esto es necesario si la imagen viene de otro dominio
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            try {
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = (error) => {
            reject(error);
        };

        img.src = url;
    });
}

async function downloadPDF() {
    const clientName = document.getElementById('clientName').value.trim();
    const invoiceDate = document.getElementById('invoiceDate').value;

    if (!clientName) {
        alert('Por favor, ingresa el nombre del cliente antes de descargar la factura.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Agregar logo
    try {
        const logoImg = await getBase64Image('assets/Logo.png'); // Asegúrate de que la ruta sea correcta
        doc.addImage(logoImg, 'PNG', 10, 10, 50, 30);
    } catch (error) {
        console.error('Error al cargar el logo:', error);
        alert('No se pudo cargar el logo, pero se continuará generando el PDF');
    }

    // Información de la empresa
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const nombreLineas = companyInfo.name.split('\n');
    nombreLineas.forEach((linea, index) => {
        doc.setTextColor(0, 128,0);
        doc.text(linea, 150, 20 + (index * 7), { align: 'right' });
    });

    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const direccionLineas = companyInfo.address.split('\n');
    direccionLineas.forEach((linea, index) => {
        doc.text(linea, 150, 34 + (index * 7), { align: 'right' });
    });
    
    doc.text(companyInfo.phone, 150, 34 + (direccionLineas.length * 7) + 7, { align: 'right' });

    // Información del cliente y fecha
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, 60, 70);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoiceDate), 60, 80);

    // Tabla de productos
    const tableColumn = ['Cantidad', 'Descripción', 'Precio Unit.', 'Total'];
    const tableRows = products.map(product => [
        product.quantity,
        product.description,
        product.unitPrice.toFixed(2),
        product.totalPrice.toFixed(2)
    ]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 5
        },
        headStyles: {
            fillColor: [66, 66, 66]
        }
    });

    const finalY = doc.previousAutoTable.finalY || 150;

    // Precio final
    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.5);
    doc.setTextColor(0, 128, 0);
    doc.line(120, finalY + 5, 190, finalY + 5);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Precio Final:', 120, finalY + 15);
    doc.text(`$${precioFinalSpan.textContent}`, 190, finalY + 15, { align: 'right' });

    // Generar nombre del archivo con fecha y cliente
    const fecha = invoiceDate.replace(/-/g, '-');
    /*const fecha = new Date(invoiceDate).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC' // Usar UTC para evitar ajustes de zona horaria
    }).replace(/\//g, '-');*/
    
    // Limpiar el nombre del cliente de caracteres especiales
    const nombreLimpio = clientName
        .replace(/[^\w\s]/gi, '') // Elimina caracteres especiales
        .replace(/\s+/g, '_');    // Reemplaza espacios con guiones bajos
    
    const nombreArchivo = `factura_${nombreLimpio}_${fecha}.pdf`;
    
    doc.save(nombreArchivo);
}