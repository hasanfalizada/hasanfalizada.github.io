// +++===+++ 2025-08-28 17:15 UTC — Hasan Alizada — PDF generator using html2canvas + jsPDF for NovoResume-style functionality

class PDFGenerator {
    constructor() {
        this.isGenerating = false;
        this.html2canvasReady = false;
        this.jsPDFReady = false;
        console.log('+++===+++ PDFGenerator initialized with Canvas-to-PDF approach');
    }

    /**
     * Ensures required libraries are loaded
     * @returns {Promise<boolean>}
     */
    async ensureLibrariesLoaded() {
        console.log('+++===+++ Ensuring html2canvas and jsPDF libraries are loaded');

        if (this.html2canvasReady && this.jsPDFReady && window.html2canvas && window.jsPDF) {
            console.log('+++===+++ Libraries already loaded and ready');
            return true;
        }

        return new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalLibraries = 2;

            const checkComplete = () => {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    this.html2canvasReady = true;
                    this.jsPDFReady = true;
                    resolve(true);
                }
            };

            // Load html2canvas
            if (!window.html2canvas) {
                console.log('+++===+++ Loading html2canvas from CDN');
                const html2canvasScript = document.createElement('script');
                html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                html2canvasScript.onload = () => {
                    console.log('+++===+++ html2canvas loaded successfully');
                    checkComplete();
                };
                html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(html2canvasScript);
            } else {
                checkComplete();
            }

            // Load jsPDF
            if (!window.jsPDF) {
                console.log('+++===+++ Loading jsPDF from CDN');
                const jsPDFScript = document.createElement('script');
                jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                jsPDFScript.onload = () => {
                    console.log('+++===+++ jsPDF loaded successfully');
                    checkComplete();
                };
                jsPDFScript.onerror = () => reject(new Error('Failed to load jsPDF'));
                document.head.appendChild(jsPDFScript);
            } else {
                checkComplete();
            }
        });
    }

    /**
     * Clones and prepares resume DOM content for PDF generation
     * @returns {{success: boolean, clonedElement: Element|null, error: string|null}}
     */
    formatResumeLayout() {
        console.log('+++===+++ Starting formatResumeLayout - cloning resume DOM content');

        try {
            // Find the resume content element
            const resumeContent = document.getElementById('resume-content');
            if (!resumeContent) {
                throw new Error('Resume content element not found (#resume-content)');
            }

            console.log('+++===+++ Found resume content element, cloning DOM');
            console.log('+++===+++ Original content innerHTML length:', resumeContent.innerHTML.length);
            console.log('+++===+++ Original content children count:', resumeContent.children.length);

            // Create a deep clone of the resume content
            const clonedElement = resumeContent.cloneNode(true);

            console.log('+++===+++ Cloned content innerHTML length:', clonedElement.innerHTML.length);
            console.log('+++===+++ Cloned content children count:', clonedElement.children.length);

            console.log('+++===+++ Cleaning cloned element for PDF generation');

            // Remove any loading indicators or non-essential elements
            const loadingElements = clonedElement.querySelectorAll('.loading, .error');
            loadingElements.forEach(el => el.remove());

            // Remove any interactive elements that don't make sense in PDF
            const interactiveElements = clonedElement.querySelectorAll('button, .nav-link');
            interactiveElements.forEach(el => el.remove());

            // Force load all images by converting to absolute URLs
            const images = clonedElement.querySelectorAll('img');
            console.log(`+++===+++ Processing ${images.length} images for PDF`);

            images.forEach((img, index) => {
                if (img.src && !img.src.startsWith('http') && !img.src.startsWith('data:')) {
                    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
                    img.src = baseUrl + img.src.replace(/^\.\//, '');
                }

                // Ensure images are not lazy loaded
                img.loading = 'eager';
                img.style.display = 'block';

                console.log(`+++===+++ Image ${index + 1}: ${img.src.substring(0, 50)}...`);
            });

            // Add PDF-specific styling class
            clonedElement.classList.add('pdf-content');

            console.log('+++===+++ Resume content cloned and prepared successfully');

            return {
                success: true,
                clonedElement: clonedElement,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error formatting resume layout:', error.message);
            return {
                success: false,
                clonedElement: null,
                error: error.message
            };
        }
    }

    /**
     * Creates canvas-optimized CSS styles
     * @returns {string} CSS styles for canvas rendering
     */
    createCanvasStyles() {
        console.log('+++===+++ Creating canvas-optimized styles');

        return `
            <style>
                .pdf-canvas-container {
                    width: 794px !important;
                    min-height: 1123px;
                    margin: 0 !important;
                    padding: 40px !important;
                    background: white !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    font-size: 14px !important;
                    line-height: 1.4 !important;
                    color: #000 !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                }

                /* Ensure all elements are visible and properly styled */
                .pdf-canvas-container * {
                    box-sizing: border-box !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                /* Resume hero section */
                .pdf-canvas-container .resume-hero {
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 20px !important;
                    margin-bottom: 25px !important;
                }

                .pdf-canvas-container .resume-photo {
                    width: 120px !important;
                    height: 120px !important;
                    border-radius: 8% !important;
                    object-fit: cover !important;
                    flex-shrink: 0 !important;
                    display: block !important;
                }

                .pdf-canvas-container .resume-hero__text {
                    flex: 1 !important;
                }

                .pdf-canvas-container .resume-header__name {
                    font-size: 28px !important;
                    font-weight: 700 !important;
                    margin: 0 0 5px 0 !important;
                    color: #000 !important;
                    line-height: 1.2 !important;
                }

                .pdf-canvas-container .resume-header__title {
                    font-size: 18px !important;
                    color: #666 !important;
                    margin: 0 0 10px 0 !important;
                    line-height: 1.2 !important;
                }

                .pdf-canvas-container .resume-header__summary {
                    font-size: 14px !important;
                    line-height: 1.4 !important;
                    color: #000 !important;
                    margin: 0 !important;
                }

                /* Contact section */
                .pdf-canvas-container .contacts-card {
                    background: #f5f5f5 !important;
                    padding: 15px !important;
                    border-radius: 8px !important;
                    margin: 20px 0 !important;
                }

                .pdf-canvas-container .contacts-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 8px 30px !important;
                }

                .pdf-canvas-container .contact-row {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    font-size: 12px !important;
                    margin: 5px 0 !important;
                }

                .pdf-canvas-container .contact-icon {
                    width: 16px !important;
                    height: 16px !important;
                    flex-shrink: 0 !important;
                    display: block !important;
                }

                /* Section titles */
                .pdf-canvas-container .resume-section__title {
                    font-size: 18px !important;
                    font-weight: 700 !important;
                    margin: 25px 0 15px 0 !important;
                    padding-bottom: 5px !important;
                    border-bottom: 2px solid #000 !important;
                    color: #000 !important;
                }

                /* Skills pills */
                .pdf-canvas-container .resume-list--skills {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 8px !important;
                    margin: 15px 0 25px 0 !important;
                    list-style: none !important;
                    padding: 0 !important;
                }

                .pdf-canvas-container .resume-list--skills li {
                    background: #9e9e9e !important;
                    color: white !important;
                    padding: 6px 12px !important;
                    border-radius: 15px !important;
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    display: inline-block !important;
                }

                /* Technical skills grid */
                .pdf-canvas-container .tech-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 10px 40px !important;
                    margin: 15px 0 25px 0 !important;
                }

                .pdf-canvas-container .tech-row {
                    display: grid !important;
                    grid-template-columns: 160px 1fr !important;
                    gap: 10px !important;
                    margin-bottom: 8px !important;
                    align-items: start !important;
                }

                .pdf-canvas-container .tech-label {
                    font-weight: 700 !important;
                    color: #000 !important;
                    font-size: 12px !important;
                }

                .pdf-canvas-container .tech-label::after {
                    content: ":" !important;
                }

                .pdf-canvas-container .tech-value {
                    font-size: 12px !important;
                    color: #000 !important;
                    line-height: 1.4 !important;
                }

                /* Work experience */
                .pdf-canvas-container .experience-card {
                    margin: 20px 0 !important;
                }

                .pdf-canvas-container .experience-position {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    color: #000 !important;
                    margin: 0 0 3px 0 !important;
                }

                .pdf-canvas-container .experience-company {
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    color: #000 !important;
                    margin: 0 0 3px 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }

                .pdf-canvas-container .experience-company-logo {
                    width: 16px !important;
                    height: 16px !important;
                    object-fit: contain !important;
                    display: block !important;
                }

                .pdf-canvas-container .experience-meta {
                    display: flex !important;
                    justify-content: space-between !important;
                    font-size: 11px !important;
                    color: #666 !important;
                    margin: 0 0 8px 0 !important;
                }

                .pdf-canvas-container .experience-description {
                    font-size: 11px !important;
                    color: #666 !important;
                    margin: 0 0 10px 0 !important;
                    line-height: 1.4 !important;
                }

                .pdf-canvas-container .experience-achievements {
                    list-style: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }

                .pdf-canvas-container .experience-achievements li {
                    margin: 0 0 6px 0 !important;
                    padding-left: 15px !important;
                    position: relative !important;
                    font-size: 12px !important;
                    line-height: 1.4 !important;
                }

                .pdf-canvas-container .experience-achievements li::before {
                    content: "•" !important;
                    position: absolute !important;
                    left: 0 !important;
                    color: #000 !important;
                    font-weight: bold !important;
                }

                /* Education, Certificates, Languages */
                .pdf-canvas-container .education-card,
                .pdf-canvas-container .cert-list,
                .pdf-canvas-container .lang-grid {
                    margin: 15px 0 25px 0 !important;
                }

                .pdf-canvas-container .education-degree {
                    font-weight: 700 !important;
                    font-size: 14px !important;
                    color: #000 !important;
                }

                .pdf-canvas-container .education-institution,
                .pdf-canvas-container .education-period,
                .pdf-canvas-container .education-location {
                    font-size: 12px !important;
                    color: #000 !important;
                }

                .pdf-canvas-container .cert-list {
                    list-style: none !important;
                    padding: 0 !important;
                }

                .pdf-canvas-container .cert-row {
                    margin: 6px 0 !important;
                    font-size: 12px !important;
                }

                .pdf-canvas-container .cert-name {
                    font-weight: 600 !important;
                    color: #000 !important;
                }

                .pdf-canvas-container .cert-period {
                    color: #666 !important;
                }

                /* Languages with dots */
                .pdf-canvas-container .lang-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 8px 30px !important;
                }

                .pdf-canvas-container .lang-row {
                    display: grid !important;
                    grid-template-columns: 80px 1fr !important;
                    gap: 10px !important;
                    align-items: center !important;
                    margin: 6px 0 !important;
                }

                .pdf-canvas-container .lang-name {
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #000 !important;
                }

                .pdf-canvas-container .lang-dots {
                    display: flex !important;
                    gap: 3px !important;
                }

                .pdf-canvas-container .lang-dot {
                    width: 6px !important;
                    height: 6px !important;
                    border-radius: 50% !important;
                    background: #ddd !important;
                    display: block !important;
                }

                .pdf-canvas-container .lang-dot.is-filled {
                    background: #000 !important;
                }
            </style>
        `;
    }

    /**
     * Generates PDF using html2canvas + jsPDF approach
     * @param {Element} clonedElement - Cloned resume DOM element
     * @param {object} options - Generation options
     * @returns {Promise<{success: boolean, pdfBlob: Blob|null, error: string|null}>}
     */
    async generatePDF(clonedElement, options = {}) {
        console.log('+++===+++ Starting PDF generation using html2canvas + jsPDF approach');

        try {
            if (this.isGenerating) {
                throw new Error('PDF generation already in progress');
            }

            this.isGenerating = true;

            // Ensure libraries are loaded
            const librariesLoaded = await this.ensureLibrariesLoaded();
            if (!librariesLoaded) {
                throw new Error('Required libraries failed to load');
            }

            console.log('+++===+++ Creating canvas-optimized container');

            // Create container for canvas rendering
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'pdf-canvas-container';
            canvasContainer.id = 'pdf-canvas-container';

            // Add canvas styles
            const styles = this.createCanvasStyles();

            // Create wrapper with styles and content
            const wrapper = document.createElement('div');
            wrapper.innerHTML = styles;
            wrapper.appendChild(clonedElement);

            canvasContainer.appendChild(wrapper);

            // Add to document (visible but off-screen)
            canvasContainer.style.position = 'fixed';
            canvasContainer.style.top = '0';
            canvasContainer.style.left = '100vw';
            canvasContainer.style.zIndex = '10000';
            document.body.appendChild(canvasContainer);

            // Wait for images to load
            console.log('+++===+++ Waiting for images to load');
            const images = canvasContainer.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails
                });
            }));

            console.log('+++===+++ Container dimensions:', canvasContainer.offsetWidth, 'x', canvasContainer.scrollHeight);

            // Generate canvas using html2canvas
            console.log('+++===+++ Generating canvas from HTML');
            const canvas = await window.html2canvas(canvasContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: canvasContainer.offsetWidth,
                height: canvasContainer.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                logging: false
            });

            console.log('+++===+++ Canvas generated:', canvas.width, 'x', canvas.height);

            // Create PDF from canvas
            console.log('+++===+++ Creating PDF from canvas');

            // Handle different jsPDF global access patterns
            let jsPDF;
            if (window.jsPDF) {
                jsPDF = window.jsPDF;
                console.log('+++===+++ Using window.jsPDF');
            } else if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
                console.log('+++===+++ Using window.jspdf.jsPDF');
            } else {
                throw new Error('jsPDF constructor not found in expected locations');
            }

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = 210; // A4 width in mm
            const pdfHeight = 297; // A4 height in mm

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Calculate scaling to fit width
            const ratio = (pdfWidth - 20) / (canvasWidth / 2); // Account for scale and margins
            const scaledHeight = (canvasHeight / 2) * ratio;

            let currentY = 0;
            let pageCount = 1;

            while (currentY < scaledHeight) {
                if (pageCount > 1) {
                    pdf.addPage();
                }

                // Calculate the portion of canvas to include
                const sourceY = (currentY / ratio) * 2; // Account for scale
                const sourceHeight = Math.min((pdfHeight - 20) / ratio * 2, (canvasHeight - sourceY));

                if (sourceHeight > 0) {
                    // Create a temporary canvas for this page
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvasWidth;
                    pageCanvas.height = sourceHeight;

                    const pageCtx = pageCanvas.getContext('2d');
                    pageCtx.drawImage(canvas, 0, sourceY, canvasWidth, sourceHeight, 0, 0, canvasWidth, sourceHeight);

                    // Add to PDF
                    const pageDataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
                    pdf.addImage(pageDataUrl, 'JPEG', 10, 10, pdfWidth - 20, (sourceHeight / 2) * ratio);
                }

                currentY += pdfHeight - 20;
                pageCount++;
            }

            console.log(`+++===+++ PDF created with ${pageCount - 1} pages`);

            // Generate blob
            const pdfBlob = pdf.output('blob');
            console.log('+++===+++ PDF blob generated, size:', pdfBlob.size, 'bytes');

            // Auto-download the PDF
            console.log('+++===+++ Auto-downloading PDF');
            const filename = options.filename || 'Hasan_Alizada_Resume.pdf';
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Cleanup
            if (canvasContainer && canvasContainer.parentNode) {
                canvasContainer.parentNode.removeChild(canvasContainer);
            }

            this.isGenerating = false;

            return {
                success: true,
                pdfBlob: pdfBlob,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error generating PDF:', error.message);

            // Cleanup on error
            const canvasContainer = document.getElementById('pdf-canvas-container');
            if (canvasContainer && canvasContainer.parentNode) {
                canvasContainer.parentNode.removeChild(canvasContainer);
            }

            this.isGenerating = false;

            return {
                success: false,
                pdfBlob: null,
                error: error.message
            };
        }
    }

    /**
     * Downloads the generated PDF with proper filename
     * @param {Blob} pdfBlob - PDF blob to download
     * @param {object} options - Download options
     * @returns {{success: boolean, error: string|null}}
     */
    downloadPDF(pdfBlob, options = {}) {
        console.log('+++===+++ Starting PDF download process');

        try {
            if (!pdfBlob || !(pdfBlob instanceof Blob)) {
                throw new Error('Invalid PDF blob provided');
            }

            const defaultOptions = {
                filename: 'Hasan_Alizada_Resume.pdf',
                openInNewTab: false
            };

            const downloadOptions = { ...defaultOptions, ...options };

            console.log(`+++===+++ Creating download for file: ${downloadOptions.filename}`);

            if (downloadOptions.openInNewTab) {
                // Open in new tab
                const url = URL.createObjectURL(pdfBlob);
                window.open(url, '_blank');
                // Clean up after a delay
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                // Direct download
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = downloadOptions.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            console.log('+++===+++ PDF download initiated successfully');
            return {
                success: true,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error downloading PDF:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate and download PDF in one operation (legacy method for compatibility)
     * @param {object} resumeData - Complete resume data (unused in canvas approach)
     * @param {object} options - PDF and download options
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async generateAndDownload(resumeData, options = {}) {
        console.log('+++===+++ Starting generate and download operation with Canvas-to-PDF');

        try {
            // Prevent duplicate calls
            if (this.isGenerating) {
                console.log('+++===+++ PDF generation already in progress, skipping duplicate call');
                return {
                    success: false,
                    error: 'PDF generation already in progress'
                };
            }

            // Format resume layout (clone DOM)
            const layoutResult = this.formatResumeLayout();
            if (!layoutResult.success) {
                return layoutResult;
            }

            // Generate PDF from canvas - this handles download internally
            const generateResult = await this.generatePDF(layoutResult.clonedElement, options);

            // Don't call downloadPDF separately since generatePDF already handles it
            console.log('+++===+++ Canvas-to-PDF operation completed successfully');
            return generateResult;

        } catch (error) {
            console.error('+++===+++ Error in generate and download:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFGenerator;
} else {
    window.PDFGenerator = PDFGenerator;
}