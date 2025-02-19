// Supabase 설정
const SUPABASE_URL = "https://figegcvlqvikglgrjgeq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ2VnY3ZscXZpa2dsZ3JqZ2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDQ0OTAsImV4cCI6MjA1NTUyMDQ5MH0.wvyazV6DQp8Z4baoAuqSSx0Uso8YxWt5_nr89boZBmo";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM 요소
const fileInput = document.getElementById('fileInput');
const nicknameInput = document.getElementById('nicknameInput');
const previewImage = document.getElementById('previewImage');
const previewArea = document.querySelector('.preview-area');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultArea = document.getElementById('resultArea');
const uploadedImage = document.getElementById('uploadedImage');
const uploadBtn = document.getElementById('uploadBtn');

// 파일 선택시 미리보기
fileInput.addEventListener('change', function(e) {
    handleFileSelect(e.target.files[0]);
});

// 파일 처리 함수
function handleFileSelect(file) {
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
        showToast('warning', '이미지 파일만 업로드 가능합니다.');
        return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('warning', '파일 크기는 10MB 이하여야 합니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewArea.style.display = 'block';
    }
    reader.readAsDataURL(file);
}

// 드래그 앤 드롭 기능
const dropZone = document.querySelector('.drop-zone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drop-zone-hover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drop-zone-hover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drop-zone-hover');
    handleFileSelect(e.dataTransfer.files[0]);
});

// 터치 이벤트 처리
let touchTimeout;
dropZone.addEventListener('touchstart', () => {
    touchTimeout = setTimeout(() => {
        dropZone.classList.add('drop-zone-hover');
    }, 100);
});

dropZone.addEventListener('touchend', () => {
    clearTimeout(touchTimeout);
    dropZone.classList.remove('drop-zone-hover');
});

async function uploadImage() {
    const file = fileInput.files[0];
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
        showToast('warning', '닉네임을 입력해주세요.');
        nicknameInput.focus();
        return;
    }

    if (!file) {
        showToast('warning', '파일을 선택해주세요.');
        return;
    }

    // UI 상태 업데이트
    uploadBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    resultArea.style.display = 'none';

    try {
        // 파일명에 닉네임과 타임스탬프 추가
        const fileExtension = file.name.split('.').pop();
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
        const filePath = `uploads/${nickname}-${timestamp}.${fileExtension}`;

        // Supabase Storage로 업로드
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(filePath, file, {
                upsert: true
            });

        if (error) throw error;

        // 업로드된 파일의 공개 URL 가져오기
        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

        if (publicUrl) {
            showToast('success', '이미지가 성공적으로 업로드되었습니다!');

            // 3초 후 창 닫기
            setTimeout(() => {
                window.close();
            }, 3000);
        }
    } catch (error) {
        console.error('업로드 실패:', error);
        showToast('error', '업로드 실패: ' + error.message);
    } finally {
        uploadBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

function closeResultArea() {
    resultArea.style.display = 'none';
    uploadedImage.style.display = 'none';
    uploadedImage.src = '';
}

function showToast(type, message) {
    const toastHtml = `
        <div class="position-fixed bottom-0 start-50 translate-middle-x p-3" style="z-index: 11">
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'danger'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
