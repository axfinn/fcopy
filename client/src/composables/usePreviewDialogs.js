import { ref } from 'vue';

export function usePreviewDialogs(){
  const textVisible = ref(false);
  const pdfVisible = ref(false);
  const imageVisible = ref(false);
  const file = ref(null);
  const textContent = ref('');
  const imageUrl = ref('');

  function openText(f, content){ file.value=f; textContent.value=content; textVisible.value=true; }
  function openPdf(f){ file.value=f; pdfVisible.value=true; }
  function openImage(f, url){ file.value=f; imageUrl.value=url; imageVisible.value=true; }
  function close(){
    textVisible.value=false; pdfVisible.value=false; imageVisible.value=false; file.value=null; textContent.value='';
    if(imageUrl.value){ URL.revokeObjectURL(imageUrl.value); imageUrl.value=''; }
  }

  return { textVisible, pdfVisible, imageVisible, file, textContent, imageUrl, openText, openPdf, openImage, close };
}
