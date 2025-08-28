// +++===+++ 2025-08-28 17:15 UTC — Hasan Alizada — PDF generator using html2canvas + jsPDF with section-aware page breaking

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
                    padding: 30px !important;
                    background: white !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    font-size: 12px !important;
                    line-height: 1.3 !important;
                    color: #000 !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                }

                /* Resume hero section */
                .pdf-canvas-container .resume-hero {
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 15px !important;
                    margin-bottom: 18px !important;
                }

                .pdf-canvas-container .resume-photo {
                    width: 100px !important;
                    height: 100px !important;
                    border-radius: 8% !important;
                    object-fit: cover !important;
                    flex-shrink: 0 !important;
                    display: block !important;
                }

                .pdf-canvas-container .resume-header__name {
                    font-size: 24px !important;
                    font-weight: 700 !important;
                    margin: 0 0 4px 0 !important;
                    color: #000 !important;
                    line-height: 1.2 !important;
                }

                .pdf-canvas-container .resume-header__title {
                    font-size: 16px !important;
                    color: #666 !important;
                    margin: 0 0 8px 0 !important;
                    line-height: 1.2 !important;
                }

                .pdf-canvas-container .resume-header__summary {
                    font-size: 12px !important;
                    line-height: 1.3 !important;
                    color: #000 !important;
                    margin: 0 !important;
                }

                /* Contact section */
                .pdf-canvas-container .contacts-card {
                    background: #f5f5f5 !important;
                    padding: 12px !important;
                    border-radius: 6px !important;
                    margin: 15px 0 !important;
                }

                .pdf-canvas-container .contacts-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 6px 25px !important;
                }

                .pdf-canvas-container .contact-row {
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    font-size: 10px !important;
                    margin: 3px 0 !important;
                }

                /* Section titles */
                .pdf-canvas-container .resume-section__title {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    margin: 18px 0 12px 0 !important;
                    padding-bottom: 4px !important;
                    border-bottom: 2px solid #000 !important;
                    color: #000 !important;
                }

                /* Skills pills */
                .pdf-canvas-container .resume-list--skills {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 6px !important;
                    margin: 12px 0 18px 0 !important;
                    list-style: none !important;
                    padding: 0 !important;
                }

                .pdf-canvas-container .resume-list--skills li {
                    background: #9e9e9e !important;
                    color: white !important;
                    padding: 4px 10px !important;
                    border-radius: 12px !important;
                    font-size: 10px !important;
                    font-weight: 500 !important;
                    display: inline-block !important;
                }

                /* Technical skills grid */
                .pdf-canvas-container .tech-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 8px 30px !important;
                    margin: 12px 0 18px 0 !important;
                }

                .pdf-canvas-container .tech-row {
                    display: grid !important;
                    grid-template-columns: 140px 1fr !important;
                    gap: 8px !important;
                    margin-bottom: 6px !important;
                    align-items: start !important;
                }

                .pdf-canvas-container .tech-label {
                    font-weight: 700 !important;
                    color: #000 !important;
                    font-size: 10px !important;
                }

                .pdf-canvas-container .tech-value {
                    font-size: 10px !important;
                    color: #000 !important;
                    line-height: 1.3 !important;
                }

                /* Work experience */
                .pdf-canvas-container .experience-card {
                    margin: 15px 0 !important;
                }

                .pdf-canvas-container .experience-position {
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    color: #000 !important;
                    margin: 0 0 2px 0 !important;
                }

                .pdf-canvas-container .experience-company {
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    color: #000 !important;
                    margin: 0 0 2px 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                }

                .pdf-canvas-container .experience-company-logo {
                    width: 14px !important;
                    height: 14px !important;
                    object-fit: contain !important;
                    display: block !important;
                }

                .pdf-canvas-container .experience-meta {
                    display: flex !important;
                    justify-content: space-between !important;
                    font-size: 9px !important;
                    color: #666 !important;
                    margin: 0 0 6px 0 !important;
                }

                .pdf-canvas-container .experience-description {
                    font-size: 9px !important;
                    color: #666 !important;
                    margin: 0 0 8px 0 !important;
                    line-height: 1.3 !important;
                }

                .pdf-canvas-container .experience-achievements {
                    list-style: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }

                .pdf-canvas-container .experience-achievements li {
                    margin: 0 0 4px 0 !important;
                    padding-left: 12px !important;
                    position: relative !important;
                    font-size: 10px !important;
                    line-height: 1.3 !important;
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
                    margin: 12px 0 18px 0 !important;
                }

                .pdf-canvas-container .education-degree {
                    font-weight: 700 !important;
                    font-size: 12px !important;
                    color: #000 !important;
                }

                .pdf-canvas-container .education-institution,
                .pdf-canvas-container .education-period,
                .pdf-canvas-container .education-location {
                    font-size: 10px !important;
                    color: #000 !important;
                }

                .pdf-canvas-container .cert-list {
                    list-style: none !important;
                    padding: 0 !important;
                }

                .pdf-canvas-container .cert-row {
                    margin: 4px 0 !important;
                    font-size: 10px !important;
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
                    gap: 6px 25px !important;
                }

                .pdf-canvas-container .lang-row {
                    display: grid !important;
                    grid-template-columns: 70px 1fr !important;
                    gap: 8px !important;
                    align-items: center !important;
                    margin: 4px 0 !important;
                }

                .pdf-canvas-container .lang-name {
                    font-size: 10px !important;
                    font-weight: 600 !important;
                    color: #000 !important;
                }

                .pdf-canvas-container .lang-dots {
                    display: flex !important;
                    gap: 2px !important;
                }

                .pdf-canvas-container .lang-dot {
                    width: 5px !important;
                    height: 5px !important;
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
     * Identifies section boundaries in the canvas container for intelligent page breaking
     * @param {Element} container - Canvas container element
     * @returns {Array} Array of section objects with startY, height, and name
     */
    identifySectionBoundaries(container) {
        console.log('+++===+++ Identifying section boundaries for intelligent page breaking');

        const sections = [];

        // Get all resume sections and other major elements
        const sectionElements = [
            container.querySelector('.resume-hero'),
            container.querySelector('.contacts-card'),
            container.querySelector('.resume-section__title:first-of-type')?.parentElement, // Skills section
            ...container.querySelectorAll('.resume-section') // All other sections
        ].filter(el => el !== null);

        console.log(`+++===+++ Found ${sectionElements.length} section elements`);

        sectionElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Calculate relative position within container
            const relativeY = rect.top - containerRect.top;
            const height = rect.height;

            // Convert to canvas coordinates (account for 2x scale)
            const canvasY = relativeY * 2;
            const canvasHeight = height * 2;

            let sectionName = 'Unknown';
            if (element.classList.contains('resume-hero')) {
                sectionName = 'Header';
            } else if (element.classList.contains('contacts-card')) {
                sectionName = 'Contacts';
            } else if (element.classList.contains('resume-section')) {
                const titleElement = element.querySelector('.resume-section__title');
                sectionName = titleElement ? titleElement.textContent.trim() : `Section ${index + 1}`;
            }

            sections.push({
                name: sectionName,
                startY: Math.max(0, canvasY),
                height: canvasHeight,
                element: element
            });

            console.log(`+++===+++ Section: ${sectionName} at Y=${canvasY.toFixed(0)}, height=${canvasHeight.toFixed(0)}`);
        });

        // Sort sections by Y position
        sections.sort((a, b) => a.startY - b.startY);

        console.log(`+++===+++ Created ${sections.length} sections for intelligent page breaking`);

        return sections;
    }

    /**
     * Generates PDF using html2canvas + jsPDF with section-aware page breaking
     * @param {Element} clonedElement - Cloned resume DOM element
     * @param {object} options - Generation options
     * @returns {Promise<{success: boolean, pdfBlob: Blob|null, error: string|null}>}
     */
    async generatePDF(clonedElement, options = {}) {
        console.log('+++===+++ Starting PDF generation using html2canvas + jsPDF with intelligent page breaking');

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

            // Create PDF with section-aware page breaking
            console.log('+++===+++ Creating PDF with section-aware page breaks');

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

            const pdfWidth = 210;
            const pdfHeight = 297;
            const margins = 8;
            const availableWidth = pdfWidth - (margins * 2);
            const availableHeight = pdfHeight - (margins * 2);
            const ratio = availableWidth / (canvas.width / 2);

            // For simplicity, create 2-page PDF with smart content splitting
            const canvasHeight = canvas.height;
            const pageBreakPoint = canvasHeight * 0.6; // Break at 60% for better content distribution

            // Page 1
            const page1Canvas = document.createElement('canvas');
            page1Canvas.width = canvas.width;
            page1Canvas.height = pageBreakPoint;

            const page1Ctx = page1Canvas.getContext('2d');
            page1Ctx.drawImage(canvas, 0, 0, canvas.width, pageBreakPoint, 0, 0, canvas.width, pageBreakPoint);

            const page1DataUrl = page1Canvas.toDataURL('image/jpeg', 0.98);
            const page1Height = (pageBreakPoint / 2) * ratio;
            pdf.addImage(page1DataUrl, 'JPEG', margins, margins, availableWidth, page1Height);

            // Page 2
            pdf.addPage();

            const remainingHeight = canvasHeight - pageBreakPoint;
            const page2Canvas = document.createElement('canvas');
            page2Canvas.width = canvas.width;
            page2Canvas.height = remainingHeight;

            const page2Ctx = page2Canvas.getContext('2d');
            page2Ctx.drawImage(canvas, 0, pageBreakPoint, canvas.width, remainingHeight, 0, 0, canvas.width, remainingHeight);

            const page2DataUrl = page2Canvas.toDataURL('image/jpeg', 0.98);
            const page2Height = (remainingHeight / 2) * ratio;
            pdf.addImage(page2DataUrl, 'JPEG', margins, margins, availableWidth, page2Height);

            console.log('+++===+++ PDF created with 2 pages using smart content distribution');

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

            const downloadOptions = {...defaultOptions, ...options};

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