// +++===+++ 2025-08-26 16:15 UTC — Hasan Alizada — PDF Generator atom implementation using jsPDF

class PDFGenerator {
    constructor() {
        this.isGenerating = false;
        console.log('+++===+++ PDFGenerator initialized');
    }

    /**
     * Generates PDF from resume data with professional formatting
     * @param {object} resumeData - Complete resume data object
     * @param {object} options - PDF generation options
     * @returns {Promise<{success: boolean, pdfBlob: Blob, error: string|null}>}
     */
    async generatePDF(resumeData, options = {}) {
        console.log('+++===+++ Starting PDF generation');

        if (this.isGenerating) {
            console.log('+++===+++ PDF generation already in progress');
            return {
                success: false,
                pdfBlob: null,
                error: 'PDF generation already in progress'
            };
        }

        // Check if jsPDF is available
        if (typeof window.jsPDF === 'undefined') {
            console.error('+++===+++ jsPDF library not loaded');
            return {
                success: false,
                pdfBlob: null,
                error: 'PDF library not loaded'
            };
        }

        this.isGenerating = true;

        try {
            const defaultOptions = {
                format: 'a4',
                orientation: 'portrait',
                margins: { top: 20, right: 20, bottom: 20, left: 20 },
                fonts: {
                    primary: 'helvetica',
                    secondary: 'helvetica',
                    headerSize: 18,
                    bodySize: 11,
                    smallSize: 9
                },
                colors: {
                    primary: '#000000',
                    secondary: '#666666',
                    accent: '#333333'
                }
            };

            const pdfOptions = { ...defaultOptions, ...options };
            console.log('+++===+++ PDF options configured');

            // Create new jsPDF instance
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF({
                orientation: pdfOptions.orientation,
                unit: 'mm',
                format: pdfOptions.format
            });

            console.log('+++===+++ jsPDF document created');

            // Format resume data for PDF layout
            const formattedSections = this.formatResumeLayout(resumeData, {
                pageWidth: doc.internal.pageSize.getWidth(),
                pageHeight: doc.internal.pageSize.getHeight(),
                margins: pdfOptions.margins
            });

            // Generate PDF content
            await this.addContentToPDF(doc, formattedSections, pdfOptions);

            // Generate blob
            const pdfBlob = doc.output('blob');
            console.log('+++===+++ PDF blob generated successfully');

            this.isGenerating = false;
            return {
                success: true,
                pdfBlob: pdfBlob,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error generating PDF:', error);
            this.isGenerating = false;
            return {
                success: false,
                pdfBlob: null,
                error: error.message
            };
        }
    }

    /**
     * Formats resume data into PDF-ready sections with proper spacing and typography
     * @param {object} resumeData - Complete resume data
     * @param {object} layoutOptions - Layout configuration
     * @returns {{success: boolean, formattedSections: array, error: string|null}}
     */
    formatResumeLayout(resumeData, layoutOptions = {}) {
        console.log('+++===+++ Formatting resume layout for PDF');

        const sections = [];
        const { pageWidth, margins } = layoutOptions;
        const contentWidth = pageWidth - margins.left - margins.right;

        try {
            // Header section with personal info
            sections.push({
                type: 'header',
                content: resumeData.personal_info.name,
                style: { font: 'helvetica', size: 24, color: '#000000', bold: true },
                position: { x: margins.left, y: margins.top, width: contentWidth }
            });

            sections.push({
                type: 'text',
                content: resumeData.personal_info.title,
                style: { font: 'helvetica', size: 14, color: '#666666', bold: false },
                position: { x: margins.left, y: margins.top + 10, width: contentWidth }
            });

            // Contact information
            const contactInfo = `${resumeData.personal_info.contact.email} | ${resumeData.personal_info.contact.phone} | ${resumeData.personal_info.contact.location}`;
            sections.push({
                type: 'text',
                content: contactInfo,
                style: { font: 'helvetica', size: 10, color: '#666666', bold: false },
                position: { x: margins.left, y: margins.top + 18, width: contentWidth }
            });

            // Professional summary
            sections.push({
                type: 'section',
                content: 'PROFESSIONAL SUMMARY',
                style: { font: 'helvetica', size: 12, color: '#000000', bold: true },
                position: { x: margins.left, y: margins.top + 30, width: contentWidth }
            });

            sections.push({
                type: 'text',
                content: resumeData.personal_info.summary,
                style: { font: 'helvetica', size: 10, color: '#333333', bold: false },
                position: { x: margins.left, y: margins.top + 38, width: contentWidth }
            });

            // Professional skills
            sections.push({
                type: 'section',
                content: 'PROFESSIONAL SKILLS',
                style: { font: 'helvetica', size: 12, color: '#000000', bold: true },
                position: { x: margins.left, y: margins.top + 65, width: contentWidth }
            });

            const professionalSkills = resumeData.skills.professional.join(' • ');
            sections.push({
                type: 'text',
                content: professionalSkills,
                style: { font: 'helvetica', size: 10, color: '#333333', bold: false },
                position: { x: margins.left, y: margins.top + 73, width: contentWidth }
            });

            // Technical skills
            sections.push({
                type: 'section',
                content: 'TECHNICAL SKILLS',
                style: { font: 'helvetica', size: 12, color: '#000000', bold: true },
                position: { x: margins.left, y: margins.top + 95, width: contentWidth }
            });

            let yOffset = margins.top + 103;
            Object.entries(resumeData.skills.technical).forEach(([category, skills]) => {
                const categoryTitle = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ':';
                sections.push({
                    type: 'text',
                    content: categoryTitle,
                    style: { font: 'helvetica', size: 10, color: '#000000', bold: true },
                    position: { x: margins.left, y: yOffset, width: contentWidth }
                });

                let skillsArray = Array.isArray(skills) ? skills : (skills.primary || []).concat(skills.additional || []);
                const skillsText = skillsArray.join(', ');
                sections.push({
                    type: 'text',
                    content: skillsText,
                    style: { font: 'helvetica', size: 9, color: '#333333', bold: false },
                    position: { x: margins.left, y: yOffset + 5, width: contentWidth }
                });

                yOffset += 12;
            });

            // Work experience
            yOffset += 10;
            sections.push({
                type: 'section',
                content: 'WORK EXPERIENCE',
                style: { font: 'helvetica', size: 12, color: '#000000', bold: true },
                position: { x: margins.left, y: yOffset, width: contentWidth }
            });

            yOffset += 8;
            resumeData.work_experience.forEach((exp, index) => {
                // Position and company
                sections.push({
                    type: 'text',
                    content: `${exp.position} | ${exp.company}`,
                    style: { font: 'helvetica', size: 11, color: '#000000', bold: true },
                    position: { x: margins.left, y: yOffset, width: contentWidth }
                });

                // Period and location
                sections.push({
                    type: 'text',
                    content: `${exp.period} | ${exp.location}`,
                    style: { font: 'helvetica', size: 9, color: '#666666', bold: false },
                    position: { x: margins.left, y: yOffset + 5, width: contentWidth }
                });

                yOffset += 12;

                // Company description
                if (exp.company_description) {
                    sections.push({
                        type: 'text',
                        content: exp.company_description,
                        style: { font: 'helvetica', size: 9, color: '#666666', bold: false, italic: true },
                        position: { x: margins.left, y: yOffset, width: contentWidth }
                    });
                    yOffset += 8;
                }

                // Achievements
                exp.achievements.slice(0, 5).forEach(achievement => { // Limit to 5 achievements for space
                    sections.push({
                        type: 'list',
                        content: `• ${achievement}`,
                        style: { font: 'helvetica', size: 9, color: '#333333', bold: false },
                        position: { x: margins.left, y: yOffset, width: contentWidth }
                    });
                    yOffset += 6;
                });

                yOffset += 5; // Space between experiences
            });

            console.log(`+++===+++ Resume layout formatted with ${sections.length} sections`);
            return {
                success: true,
                formattedSections: sections,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error formatting resume layout:', error);
            return {
                success: false,
                formattedSections: [],
                error: error.message
            };
        }
    }

    /**
     * Add formatted content to PDF document
     * @param {object} doc - jsPDF document instance
     * @param {array} sections - Formatted sections array
     * @param {object} options - PDF options
     */
    async addContentToPDF(doc, sections, options) {
        console.log('+++===+++ Adding content to PDF document');

        const { pageHeight } = doc.internal.pageSize;
        let currentPage = 1;
        let currentY = 0;

        for (const section of sections) {
            // Check if we need a new page
            if (currentY > pageHeight - options.margins.bottom - 20) {
                doc.addPage();
                currentPage++;
                currentY = options.margins.top;
                console.log(`+++===+++ Added new page ${currentPage}`);
            }

            // Set font and style
            doc.setFont(section.style.font, section.style.bold ? 'bold' : 'normal');
            doc.setFontSize(section.style.size);
            doc.setTextColor(section.style.color);

            // Add content based on type
            switch (section.type) {
                case 'header':
                case 'section':
                case 'text':
                case 'list':
                    try {
                        const lines = doc.splitTextToSize(section.content, section.position.width);
                        doc.text(lines, section.position.x, section.position.y || currentY);
                        currentY = (section.position.y || currentY) + (lines.length * section.style.size * 0.35);
                    } catch (error) {
                        console.error(`+++===+++ Error adding text content: ${error.message}`);
                    }
                    break;

                default:
                    console.warn(`+++===+++ Unknown section type: ${section.type}`);
            }
        }

        console.log(`+++===+++ PDF content added successfully across ${currentPage} page(s)`);
    }

    /**
     * Triggers PDF download in browser with specified filename
     * @param {Blob} pdfBlob - PDF Blob object
     * @param {string} filename - Desired filename
     * @returns {{success: boolean, error: string|null}}
     */
    downloadPDF(pdfBlob, filename = 'Hasan_Alizada_Resume.pdf') {
        console.log(`+++===+++ Downloading PDF with filename: ${filename}`);

        try {
            // Create download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('+++===+++ PDF download triggered successfully');
            return {
                success: true,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error downloading PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate and download PDF in one operation
     * @param {object} resumeData - Complete resume data
     * @param {object} options - PDF and download options
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async generateAndDownload(resumeData, options = {}) {
        console.log('+++===+++ Starting generate and download operation');

        try {
            const generateResult = await this.generatePDF(resumeData, options);
            if (!generateResult.success) {
                return generateResult;
            }

            const downloadResult = this.downloadPDF(generateResult.pdfBlob, options.filename);
            if (!downloadResult.success) {
                return downloadResult;
            }

            console.log('+++===+++ Generate and download completed successfully');
            return {
                success: true,
                error: null
            };

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