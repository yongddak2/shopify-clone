export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          이용약관
        </h1>

        <div className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">
          {/* 제1조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제1조 (목적)
            </h2>
            <p>
              본 약관은 [서비스명](이하 &quot;회사&quot;)이 운영하는 온라인
              쇼핑몰(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와
              이용자(이하 &quot;회원&quot;)의 권리·의무 및 책임사항, 기타 필요한
              사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제2조 (용어의 정의)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                &quot;서비스&quot;란 회사가 제공하는 모든 온라인 상품 판매 및
                관련 부가 서비스를 의미합니다.
              </li>
              <li>
                &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를
                이용하는 회원 및 비회원을 말합니다.
              </li>
              <li>
                &quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한
                자로, 회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는
                자를 말합니다.
              </li>
              <li>
                &quot;비회원&quot;이란 회원에 가입하지 않고 회사가 제공하는
                서비스를 이용하는 자를 말합니다.
              </li>
              <li>
                &quot;콘텐츠&quot;란 회사가 서비스를 통해 제공하는 텍스트, 이미지,
                영상, 파일 등 모든 형태의 정보를 말합니다.
              </li>
            </ol>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제3조 (약관의 효력 및 변경)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
                공지함으로써 효력을 발생합니다.
              </li>
              <li>
                회사는 「전자상거래 등에서의 소비자보호에 관한 법률」,
                「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호
                등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 본 약관을
                개정할 수 있습니다.
              </li>
              <li>
                회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여
                현행 약관과 함께 서비스 초기화면에 적용일자 7일 이전부터
                공지합니다. 다만, 이용자에게 불리한 약관 변경의 경우 최소 30일
                이전부터 공지합니다.
              </li>
              <li>
                회원이 개정약관의 적용에 동의하지 않는 경우 회원은 이용계약을
                해지(탈퇴)할 수 있습니다. 개정약관 시행일까지 거부 의사를
                표시하지 않은 경우 약관에 동의한 것으로 간주합니다.
              </li>
            </ol>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제4조 (서비스 제공 및 변경)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                회사는 다음과 같은 업무를 수행합니다.
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-[var(--text-dim)]">
                  <li>상품 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
                  <li>구매계약이 체결된 상품 또는 용역의 배송</li>
                  <li>고객 문의 및 불만 처리</li>
                  <li>기타 회사가 정하는 업무</li>
                </ul>
              </li>
              <li>
                회사는 상품 또는 용역의 품절 또는 기술적 사양의 변경 등의 경우에는
                장차 체결되는 계약에 의해 제공할 상품·용역의 내용을 변경할 수
                있습니다. 이 경우 변경된 상품·용역의 내용 및 제공일자를
                명시하여 즉시 공지합니다.
              </li>
              <li>
                회사는 서비스의 제공에 필요한 경우 정기점검을 실시할 수 있으며,
                점검시간은 서비스 제공 화면에 공지한 바에 따릅니다.
              </li>
            </ol>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제5조 (회원가입)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본
                약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
              </li>
              <li>
                회사는 전항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각
                호에 해당하지 않는 한 회원으로 등록합니다.
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-[var(--text-dim)]">
                  <li>
                    가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이
                    있는 경우
                  </li>
                  <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                  <li>
                    허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은
                    경우
                  </li>
                  <li>만 14세 미만인 경우</li>
                </ul>
              </li>
              <li>
                회원가입계약의 성립시기는 회사의 승낙이 회원에게 도달한 시점으로
                합니다.
              </li>
            </ol>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제6조 (회원 탈퇴 및 자격 상실)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시
                회원탈퇴를 처리합니다.
              </li>
              <li>
                회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을
                제한·정지시킬 수 있습니다.
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-[var(--text-dim)]">
                  <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                  <li>
                    서비스를 이용하여 구입한 상품 등의 대금, 기타 서비스 이용에
                    관련하여 회원이 부담하는 채무를 기일에 이행하지 않는 경우
                  </li>
                  <li>
                    다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등
                    전자상거래 질서를 위협하는 경우
                  </li>
                  <li>
                    서비스를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에
                    반하는 행위를 하는 경우
                  </li>
                </ul>
              </li>
              <li>
                회사가 회원자격을 상실시키는 경우에는 회원등록을 말소합니다. 이
                경우 회원에게 이를 통지하고, 회원등록 말소 전에 최소한 30일 이상의
                기간을 정하여 소명할 기회를 부여합니다.
              </li>
            </ol>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제7조 (구매 및 결제)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                이용자는 서비스 내에서 다음 방법에 의하여 구매를 신청합니다.
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-[var(--text-dim)]">
                  <li>상품 검색 및 선택</li>
                  <li>수령인 성명, 배송지 주소, 연락처 입력</li>
                  <li>약관 내용, 청약철회 권리 등의 확인</li>
                  <li>결제 방법 선택 및 결제</li>
                </ul>
              </li>
              <li>
                회사는 이용자의 구매신청에 대하여 다음 각 호에 해당하는 경우
                승낙하지 않을 수 있습니다.
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-[var(--text-dim)]">
                  <li>신청 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>재고 부족 등의 사유로 정상적인 이행이 어려운 경우</li>
                  <li>기타 회사가 정한 사유에 해당하는 경우</li>
                </ul>
              </li>
              <li>
                결제 방법은 신용카드, 체크카드, 간편결제 등 회사가 정한
                수단으로 합니다.
              </li>
            </ol>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제8조 (청약철회 및 환불)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                회사와 상품 등의 구매에 관한 계약을 체결한 이용자는 수령일로부터
                7일 이내에 청약의 철회를 할 수 있습니다. 다만 「전자상거래
                등에서의 소비자보호에 관한 법률」에 따라 청약철회가 제한될 수
                있습니다.
              </li>
              <li>
                이용자는 상품 등을 배송받은 경우 다음 각 호에 해당하는 경우에는
                반품 및 교환을 할 수 없습니다.
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-[var(--text-dim)]">
                  <li>
                    이용자에게 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우
                  </li>
                  <li>이용자의 사용 또는 일부 소비에 의하여 상품의 가치가 현저히
                    감소한 경우</li>
                  <li>
                    시간의 경과에 의하여 재판매가 곤란할 정도로 상품의 가치가
                    현저히 감소한 경우
                  </li>
                  <li>
                    복제가 가능한 상품의 포장을 훼손한 경우
                  </li>
                </ul>
              </li>
              <li>
                회사는 이용자로부터 상품을 반환받은 날로부터 3영업일 이내에
                이미 지급받은 대금을 환급합니다. 이 경우 회사가 환급을 지연한
                때에는 그 지연기간에 대하여 관련 법령이 정하는 지연이자율을
                곱하여 산정한 지연이자를 지급합니다.
              </li>
            </ol>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제9조 (면책조항)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
                제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
              </li>
              <li>
                회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여는
                책임을 지지 않습니다.
              </li>
              <li>
                회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나
                서비스를 통해 얻은 자료로 인해 손해를 입은 경우에 대해서는
                책임을 지지 않습니다.
              </li>
              <li>
                회사는 이용자가 게재한 정보, 자료, 사실의 신뢰도, 정확성 등
                내용에 관해서는 책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              제10조 (분쟁 해결)
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그
                피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.
              </li>
              <li>
                회사와 이용자 간에 발생한 전자상거래 분쟁에 관하여는
                이용자의 피해구제신청에 따라 공정거래위원회 또는 시·도지사가
                의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.
              </li>
              <li>
                본 약관에 관한 소송은 민사소송법상의 관할법원에 제기합니다.
              </li>
            </ol>
          </section>

          {/* 부칙 */}
          <section className="border-t border-[var(--border-color)] pt-8">
            <p className="text-[var(--text-dim)]">
              <strong className="text-[var(--text-muted)]">부칙</strong>
              <br />
              본 약관은 [시행일자]부터 시행합니다.
            </p>
            <div className="mt-6 text-xs text-[var(--text-dim)] space-y-1">
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
