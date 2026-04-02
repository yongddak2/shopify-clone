export default function Footer() {
  return (
    <footer className="bg-[var(--footer-bg)] border-t border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 브랜드 */}
          <div>
            <h3 className="text-sm font-bold tracking-widest mb-4 text-[var(--text-primary)]">
              SHOPIFY
            </h3>
            <p className="text-xs text-[var(--text-dim)] leading-relaxed">
              미니멀 의류 쇼핑몰
            </p>
          </div>

          {/* 고객센터 */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] mb-4">
              CUSTOMER SERVICE
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-dim)]">
              <li>평일 10:00 - 18:00</li>
              <li>점심 12:00 - 13:00</li>
              <li>주말 및 공휴일 휴무</li>
            </ul>
          </div>

          {/* 회사 정보 */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] mb-4">
              COMPANY INFO
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-dim)]">
              <li>상호명: SHOPIFY</li>
              <li>대표: 홍길동</li>
              <li>사업자등록번호: 123-45-67890</li>
              <li>이메일: contact@shopify-clone.com</li>
              <li>전화: 02-1234-5678</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-dim)] text-center">
            &copy; 2025 SHOPIFY. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
