from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path("/Users/kimyeun/Developer/hamddu-frontend")
OUT = ROOT / "output/pdf/naver-login-review-draft-2026-08-23.pdf"
FONT = "/System/Library/Fonts/Supplemental/AppleGothic.ttf"
W, H = A4

ORANGE = HexColor("#FF7325")
CREAM = HexColor("#FFF8F2")
INK = HexColor("#181818")
MUTED = HexColor("#77716D")
LINE = HexColor("#E8E5E2")
SOFT = HexColor("#F5F6F7")
RED = HexColor("#D94841")

pdfmetrics.registerFont(TTFont("Noto", FONT))

screens = [
    (
        "01",
        "네이버 로그인 진입",
        "로그인 화면에서 ‘네이버로 계속하기’ 버튼을 확인합니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 14.57.30.png",
        ["네이버 로그인 버튼 노출", "서비스 이용약관 및 개인정보처리방침 링크 노출"],
    ),
    (
        "02",
        "네이버 정보 제공 동의",
        "네이버 계정 인증 후 함뜨 애플리케이션의 정보 제공 동의 화면으로 이동합니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 14.58.16.png",
        ["애플리케이션 로고와 이름 노출", "이용자 식별자, 이름, 이메일 주소 동의 항목 확인"],
    ),
    (
        "03",
        "최초 가입 온보딩 1/5",
        "함뜨에서 사용할 닉네임을 설정합니다. 별도의 서비스 비밀번호는 요구하지 않습니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 15.28.01.png",
        ["별도 비밀번호 입력 없음", "닉네임 직접 입력 또는 랜덤 추천"],
    ),
    (
        "04",
        "최초 가입 온보딩 2/5",
        "콘텐츠 추천을 위한 연령대를 선택합니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 15.28.19.png",
        ["연령대 선택 화면", "다음 단계로 진행 가능"],
    ),
    (
        "05",
        "최초 가입 온보딩 3/5",
        "서비스 경험 준비를 위한 성별을 선택합니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 15.28.30.png",
        ["성별 선택 화면", "건너뛰기 제공"],
    ),
    (
        "06",
        "최초 가입 온보딩 4/5",
        "관심 있는 뜨개 유형을 선택합니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 15.28.35.png",
        ["대바늘 또는 코바늘 선택", "추천 콘텐츠 개인화 목적 안내"],
    ),
    (
        "07",
        "가입 완료 후 홈 화면",
        "네이버 로그인과 최초 가입을 완료한 뒤 함뜨의 메인 콘텐츠를 이용할 수 있습니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 13.58.52.png",
        ["로그인 완료 후 서비스 홈 진입", "대바늘 및 코바늘 학습 콘텐츠 노출"],
    ),
    (
        "08",
        "로그인 완료 및 사용자 정보",
        "가입 완료 후 마이페이지에서 로그인 계정과 가입 정보를 확인할 수 있습니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 15.33.39.png",
        ["로그인된 사용자 프로필 노출", "네이버에서 제공받은 이메일 주소 활용 화면"],
    ),
    (
        "09",
        "로그아웃 및 회원 탈퇴",
        "마이페이지 설정 영역에서 로그아웃과 회원 탈퇴 기능에 접근할 수 있습니다.",
        "Simulator Screenshot - iPhone 16 Pro - 2026-08-23 at 15.33.33.png",
        ["로그아웃 기능 노출", "회원 탈퇴 진입 위치 노출"],
    ),
]


def text(c, value, x, y, size, color=INK):
    c.setFont("Noto", size)
    c.setFillColor(color)
    c.drawString(x, y, value)


def wrapped(c, value, x, y, width, size, leading=None, color=INK):
    leading = leading or size * 1.55
    line = ""
    lines = []
    for ch in value:
        candidate = line + ch
        if pdfmetrics.stringWidth(candidate, "Noto", size) > width and line:
            lines.append(line)
            line = ch
        else:
            line = candidate
    if line:
        lines.append(line)
    for row in lines:
        text(c, row, x, y, size, color)
        y -= leading
    return y


def cover(c):
    c.setFillColor(ORANGE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    text(c, "NAVER LOGIN REVIEW", 48, H - 70, 12, INK)
    text(c, "함뜨", 48, H - 190, 44, INK)
    text(c, "네이버 로그인", 48, H - 252, 38, INK)
    text(c, "사전 검수 제출 자료", 48, H - 302, 38, INK)
    c.setFillColor(CREAM)
    c.roundRect(48, 128, W - 96, 150, 18, fill=1, stroke=0)
    text(c, "제출본 초안", 72, 236, 15, ORANGE)
    wrapped(c, "로그인 버튼부터 정보 제공 동의, 최초 가입 온보딩, 로그인 완료 및 회원 탈퇴 위치까지의 흐름을 정리했습니다.", 72, 200, W - 144, 14, 23, INK)
    text(c, "작성일  2026. 8. 23.", 48, 54, 11, INK)
    c.showPage()


def flow_page(c, num, title, description, filename, checks):
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    text(c, f"STEP {num}", 34, H - 46, 11, ORANGE)
    text(c, title, 300, H - 86, 23, INK)
    y = wrapped(c, description, 300, H - 120, W - 334, 11.5, 18, MUTED)

    image_path = Path("/Users/kimyeun/Screenshots") / filename
    with Image.open(image_path) as im:
        iw, ih = im.size
    max_w, max_h = 235, 680
    scale = min(max_w / iw, max_h / ih)
    draw_w, draw_h = iw * scale, ih * scale
    ix, iy = 34 + (235 - draw_w) / 2, 70 + (680 - draw_h) / 2
    c.setFillColor(HexColor("#FFFFFF"))
    c.roundRect(26, 58, 251, 704, 18, fill=1, stroke=0)
    c.drawImage(str(image_path), ix, iy, draw_w, draw_h, preserveAspectRatio=True, mask="auto")

    y -= 22
    c.setFillColor(SOFT)
    card_y = max(114, y - 142)
    c.roundRect(300, card_y, W - 334, 142, 14, fill=1, stroke=0)
    text(c, "검수 확인 포인트", 318, card_y + 111, 12, INK)
    check_y = card_y + 78
    for item in checks:
        c.setFillColor(ORANGE)
        c.circle(323, check_y + 3, 3, fill=1, stroke=0)
        wrapped(c, item, 334, check_y + 8, W - 368, 10.5, 16, MUTED)
        check_y -= 38

    text(c, f"{int(num):02d} / 09", W - 78, 36, 9, MUTED)
    c.showPage()


def checklist(c):
    c.setFillColor(HexColor("#FFFFFF"))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    text(c, "SUBMISSION CHECK", 42, H - 52, 11, ORANGE)
    text(c, "제출 전 보완이 필요한 항목", 42, H - 96, 27, INK)
    wrapped(c, "네이버 공식 가이드는 로그인 버튼 클릭부터 회원가입 완료까지 노출되는 화면을 단계별로 모두 제출하도록 안내합니다.", 42, H - 130, W - 84, 11.5, 18, MUTED)

    items = [
        ("필수", "온보딩 5/5 화면", "현재 자료에는 1/5부터 4/5까지만 있습니다."),
        ("확인", "네이버 애플리케이션 이름 통일", "동의 화면의 ‘뜨개의 시작, Hamddu’를 서비스명 ‘함뜨’와 일치시키는 것을 권장합니다."),
        ("확인", "이름 정보 조회 권한", "이름을 실제로 사용하지 않는다면 API 설정에서 권한을 제거하세요. 이메일은 마이페이지 활용 화면이 확인됩니다."),
        ("권장", "동일 계정의 홈 화면으로 재캡처", "홈 화면과 마이페이지의 닉네임이 달라 보입니다. 같은 가입 흐름의 계정으로 맞추면 더 안전합니다."),
        ("권장", "회색 플로팅 버튼 없이 재캡처", "검수와 무관한 시뮬레이터 보조 버튼을 끄면 자료가 더 명확해집니다."),
    ]
    y = H - 190
    for tag, title, desc in items:
        c.setFillColor(CREAM if tag != "필수" else HexColor("#FFF1EE"))
        c.roundRect(42, y - 92, W - 84, 82, 14, fill=1, stroke=0)
        text(c, tag, 60, y - 36, 10.5, RED if tag == "필수" else ORANGE)
        text(c, title, 112, y - 36, 13, INK)
        wrapped(c, desc, 60, y - 62, W - 120, 9.5, 14, MUTED)
        y -= 101

    c.setStrokeColor(LINE)
    c.line(42, 88, W - 42, 88)
    text(c, "공식 가이드", 42, 65, 9.5, MUTED)
    text(c, "developers.naver.com/docs/login/verify/verify.md", 112, 65, 9.5, INK)
    c.showPage()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
    c.setTitle("함뜨 네이버 로그인 사전 검수 제출 자료")
    c.setAuthor("Hamddu")
    cover(c)
    for row in screens:
        flow_page(c, *row)
    checklist(c)
    c.save()


if __name__ == "__main__":
    build()
