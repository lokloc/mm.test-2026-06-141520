* DPC Extension - ZGWD1MM0003_SRV / invoiceSet
* GET_ENTITYSET 은 이미 구현됨:
*   SELECT FROM ztd1mm0037 ... INTO TABLE @et_entityset.
*
* UI5가 먼저 호출하는 단건 READ. 아래만 추가하면 됨.

METHOD invoiceset_get_entity.

  DATA ls_key TYPE zcl_zgwd1mm0003_mpc=>ts_invoice.

  io_tech_request_context->get_converted_keys(
    IMPORTING es_key = ls_key ).

  SELECT SINGLE *
    FROM ztd1mm0037
    INTO CORRESPONDING FIELDS OF @er_entity
    WHERE inv_no = @ls_key-inv_no.    " 키 필드명은 MPC/테이블 기준으로 맞출 것

  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        textid = /iwbep/cx_mgw_busi_exception=>resource_not_found.
  ENDIF.

ENDMETHOD.
