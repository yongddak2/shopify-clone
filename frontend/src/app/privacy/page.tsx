export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          개인정보처리방침
        </h1>

        <p className="text-sm text-[var(--text-secondary)] mb-10 leading-relaxed">
          [서비스명](이하 &quot;회사&quot;)은 「개인정보 보호법」 제30조에 따라
          정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
          처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을
          수립·공개합니다.
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">
          {/* 1. 수집 항목 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              1. 수집하는 개인정보 항목
            </h2>
            <p className="mb-2">
              회사는 회원가입, 상품 구매, 서비스 제공 등을 위해 다음과 같은
              개인정보를 수집합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      구분
                    </th>
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      수집 항목
                    </th>
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      수집 방법
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      필수
                    </td>
                    <td className="py-2 px-3">
                      이메일, 비밀번호(암호화), 이름, 휴대전화번호
                    </td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      회원가입
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      필수 (주문 시)
                    </td>
                    <td className="py-2 px-3">
                      수령인명, 배송지 주소, 연락처
                    </td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      주문서 작성
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      자동 수집
                    </td>
                    <td className="py-2 px-3">
                      IP 주소, 쿠키, 접속 로그, 서비스 이용 기록
                    </td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      서비스 이용 시 자동 생성
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. 수집 및 이용 목적 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              2. 개인정보 수집 및 이용 목적
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-[var(--text-primary)]">
                  회원 관리:
                </strong>{" "}
                회원제 서비스 이용에 따른 본인확인, 개인 식별, 부정이용 방지,
                가입 의사 확인, 분쟁 조정을 위한 기록 보존
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  재화 또는 서비스 제공:
                </strong>{" "}
                상품 배송, 서비스 제공, 계약서·청구서 발송, 구매 및 요금 결제,
                요금추심
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  마케팅 및 광고 활용:
                </strong>{" "}
                신규 서비스 개발, 이벤트 및 광고성 정보 제공 (선택 동의 시),
                접속 빈도 파악, 서비스 이용 통계
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">
                  고충 처리:
                </strong>{" "}
                민원인 확인, 사실조사를 위한 연락·통지, 처리결과 통보
              </li>
            </ul>
          </section>

          {/* 3. 보유 및 이용 기간 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              3. 개인정보 보유 및 이용 기간
            </h2>
            <p className="mb-3">
              회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체
              없이 파기합니다. 다만, 관계 법령에 의해 보존할 필요가 있는 경우
              다음과 같이 일정 기간 보관합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      보존 항목
                    </th>
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      보존 기간
                    </th>
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      근거 법률
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3">
                      계약 또는 청약철회 등에 관한 기록
                    </td>
                    <td className="py-2 px-3">5년</td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      전자상거래법
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3">
                      대금결제 및 재화 등의 공급에 관한 기록
                    </td>
                    <td className="py-2 px-3">5년</td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      전자상거래법
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3">
                      소비자의 불만 또는 분쟁처리에 관한 기록
                    </td>
                    <td className="py-2 px-3">3년</td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      전자상거래법
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3">
                      표시·광고에 관한 기록
                    </td>
                    <td className="py-2 px-3">6개월</td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      전자상거래법
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3">
                      웹사이트 방문 기록
                    </td>
                    <td className="py-2 px-3">3개월</td>
                    <td className="py-2 px-3 text-[var(--text-dim)]">
                      통신비밀보호법
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. 제3자 제공 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              4. 개인정보 제3자 제공
            </h2>
            <p>
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
              다만, 아래의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>
                법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
                방법에 따라 수사기관의 요구가 있는 경우
              </li>
            </ul>
          </section>

          {/* 5. 처리 위탁 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              5. 개인정보 처리 위탁
            </h2>
            <p className="mb-3">
              회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를
              위탁하고 있습니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      위탁받는 자
                    </th>
                    <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">
                      위탁 업무 내용
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3">[배송업체명]</td>
                    <td className="py-2 px-3">상품 배송</td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-3">[PG사명]</td>
                    <td className="py-2 px-3">결제 처리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. 정보주체의 권리·의무 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              6. 정보주체의 권리·의무
            </h2>
            <p className="mb-2">
              이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ol>
            <p className="mt-3">
              위 권리 행사는 마이페이지 &gt; 회원정보 수정에서 직접 처리하거나,
              개인정보 보호책임자에게 서면, 이메일로 연락하시면 지체 없이
              조치하겠습니다.
            </p>
            <p className="mt-2">
              이용자가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는
              정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지
              않습니다.
            </p>
          </section>

          {/* 7. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              7. 개인정보 보호책임자
            </h2>
            <p className="mb-3">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
              같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-[#1e1e1e] border border-[var(--border-color)] p-4 text-xs space-y-1">
              <p>
                <span className="text-[var(--text-muted)]">성명:</span>{" "}
                [대표자명]
              </p>
              <p>
                <span className="text-[var(--text-muted)]">직위:</span>{" "}
                [직위]
              </p>
              <p>
                <span className="text-[var(--text-muted)]">이메일:</span>{" "}
                [이메일]
              </p>
              <p>
                <span className="text-[var(--text-muted)]">전화:</span>{" "}
                [전화번호]
              </p>
            </div>
            <p className="mt-3 text-[var(--text-dim)]">
              기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에
              문의하시기 바랍니다.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[var(--text-dim)]">
              <li>
                개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)
              </li>
              <li>
                개인정보침해신고센터 (privacy.kisa.or.kr / 118)
              </li>
              <li>대검찰청 (www.spo.go.kr / 1301)</li>
              <li>경찰청 (ecrm.cyber.go.kr / 182)</li>
            </ul>
          </section>

          {/* 8. 고지 의무 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              8. 고지 의무
            </h2>
            <p>
              현 개인정보처리방침은 [시행일자]부터 적용됩니다. 이전의
              개인정보처리방침은 본 방침으로 대체됩니다. 개인정보처리방침 내용
              추가, 삭제 및 수정이 있을 경우에는 시행일 최소 7일 전에 서비스
              공지사항을 통해 고지합니다.
            </p>
          </section>

          {/* 사업자 정보 */}
          <section className="border-t border-[var(--border-color)] pt-8">
            <div className="text-xs text-[var(--text-dim)] space-y-1">
              <p>상호: [서비스명]</p>
              <p>대표자: [대표자명]</p>
              <p>사업자등록번호: [사업자등록번호]</p>
              <p>주소: [주소]</p>
              <p>이메일: [이메일]</p>
              <p>전화: [전화번호]</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
