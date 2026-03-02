/**
 * Print invoice content with cross-browser and cross-device support
 * @param content - HTML content to print
 */
export function printInvoice(content: string): void {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      console.warn("Popup blocked by browser, falling back to iframe method");
      if (typeof window !== "undefined" && window.alert) {
        window.alert("Popup was blocked. Using alternative print method.");
      }
      printWithIframe(content);
      return;
    }

    try {
      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();

      printWindow.addEventListener("load", () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      });
    } catch (error) {
      console.error("Error opening print window:", error);
      printWindow.close();
      printWithIframe(content);
    }
  } else {
    printWithIframe(content);
  }
}

/**
 * Print using hidden iframe (most reliable for desktop)
 * @param content - HTML content to print
 */
function printWithIframe(content: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";

  document.body.appendChild(iframe);

  try {
    const iframeDocument = iframe.contentWindow?.document;

    if (!iframeDocument) {
      console.error("Failed to access iframe document");
      document.body.removeChild(iframe);
      if (typeof window !== "undefined" && window.alert) {
        window.alert("Unable to print. Please try again.");
      }
      return;
    }

    iframeDocument.open();
    iframeDocument.write(content);
    iframeDocument.close();

    iframe.contentWindow?.addEventListener("load", () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printError) {
          console.error("Print error:", printError);
          if (typeof window !== "undefined" && window.alert) {
            window.alert("Print failed. Please try again.");
          }
        }

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    });

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  } catch (error) {
    console.error("Error in printWithIframe:", error);
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    if (typeof window !== "undefined" && window.alert) {
      window.alert("Unable to print. Please try again.");
    }
  }
}

export default printInvoice;
