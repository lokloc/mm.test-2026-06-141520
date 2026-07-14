* invoiceset_create_entity — 생성일자(Erdat) 관련 수정
*
* 오류 원인:
*   ls_head-erdat = is_data-erdat.   " ← is_data 변수 없음 (컴파일 오류)
*
* POST 데이터는 read_entry_data 로 ls_post 에 담깁니다.

*----------------------------------------------------------------------
* 1) POST 읽기 / 필수값 점검  — erdat 검증 추가 (선택)
*----------------------------------------------------------------------
  IF ls_post-budat IS INITIAL
  OR ls_post-bldat IS INITIAL.

    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        textid  = /iwbep/cx_mgw_busi_exception=>business_error
        message = '전기일/증빙일을 입력하세요.'.

  ENDIF.

  IF ls_post-erdat IS INITIAL.

    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        textid  = /iwbep/cx_mgw_busi_exception=>business_error
        message = '생성일자를 입력하세요.'.

  ENDIF.

*----------------------------------------------------------------------
* 3) 송장 Header 생성 — erdat 매핑
*----------------------------------------------------------------------
  ls_head-ernam = sy-uname.
  ls_head-erdat = ls_post-erdat.   " UI DatePicker → OData Erdat
  ls_head-erzet = sy-uzeit.

* (UI 미전달 시 sy-datum 으로 fallback 하려면)
*  ls_head-erdat = COND #(
*                    WHEN ls_post-erdat IS NOT INITIAL
*                    THEN ls_post-erdat
*                    ELSE sy-datum ).

*----------------------------------------------------------------------
* 4-7) 송장 Item 저장 — audit 필드 (테이블 NOT NULL 이면 필수)
*----------------------------------------------------------------------
    ls_inv_item-ernam = sy-uname.
    ls_inv_item-erdat = ls_post-erdat.
    ls_inv_item-erzet = sy-uzeit.

* OData MPC/DDS:
*   invoice EntityType 에 Erdat 프로퍼티가 creatable="true" 인지 확인
*   (SEGW → Entity Type → Properties → Erdat → Create 가능)
