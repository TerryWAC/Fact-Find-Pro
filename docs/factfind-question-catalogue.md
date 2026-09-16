# FactFind Pro — complete question catalogue

Generated from the executable app schemas with `node scripts/export-question-catalogue.mjs`. Contains question definitions only, never client answers. Do not edit this generated file; update the reviewed schema and regenerate it.

The four original Typeforms contain 400 questions; the app adds a required Medical email question, for 401. The original snapshots were captured on 13 September 2026. Approved wording/routing repairs are documented in [the source notes](../tests/fixtures/typeform/README.md).

Each field is shown only when both its section condition and its own field condition match. A missing condition means no extra visibility restriction at that level. Conditions use the stored answer values listed below. All conditions are evaluated by `src/lib/forms/engine.ts`; blank optional answers mean not provided, not No.

Question counts: mortgage 219, protection 104, medical 48, home 30; total **401**.

The stored schemas and original JSON fixtures remain authoritative; this Markdown is a review aid.

## Mortgage FactFind

Schema version: `1.0.0-typeform-AE8RkxUT`. Parsed-JSON SHA-256 (JSON.stringify, independent of checkout line endings): `2eb06669a7e5df7e780e2e4336332f04cc508b2d08c012f3fa71b7a9eee60eec`.

Source: `AE8RkxUT`. Sections: 13.

### Introduction

Section ID: `s1_introduction`.

Section visibility: Always available.

#### 1. Who is completing this form?

- Field ID: `who_completing`
- Source reference: `cf3c3666-af5c-4aa1-9aba-9220240ef916`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.
- Default value: `"client"`

Choices (label → stored value), in display order:

- Adviser → `adviser`
- Client → `client`

Help text:

> Choose "Adviser" to unlock the internal sections.

### Adviser Details

Section ID: `s2_adviser_details`.

Section visibility: `{"field":"who_completing","operator":"eq","value":"adviser"}`

Section guidance:

> Adviser use only — not shown to clients.

#### 2. Adviser Name

- Field ID: `adviser_name`
- Source reference: `eb7ff301-1258-423e-91d1-0f4f64ba10d0`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 3. Date of Appointment

- Field ID: `date_of_appointment`
- Source reference: `85bed86e-7881-4b86-8122-427537179854`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

### Client Source

Section ID: `s3_client_source`.

Section visibility: `{"field":"who_completing","operator":"eq","value":"adviser"}`

Section guidance:

> Adviser use only — not shown to clients.

#### 4. Source

- Field ID: `source`
- Source reference: `7ff9e10d-442d-436f-9c4b-2f32ed0d215c`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Existing Client → `existing_client`
- Referral → `referral`
- Social media → `social_media`
- Event → `event`
- Family → `family`
- Cold Call → `cold_call`
- Company Lead → `company_lead`
- Other → `other`

#### 5. If 'Other', please specify source details

- Field ID: `if_other_please_specify_source_details`
- Source reference: `9c37ad96-1541-43e9-8558-cfddb8c9f63c`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

### Applicant 1 Details

Section ID: `s4_applicant_1_details`.

Section visibility: Always available.

**Group heading:** Applicant 1 details

#### 6. Title

- Field ID: `a1_title`
- Source reference: `9d5aa651-1405-4990-84ae-1766c20563db`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 7. Full Name

- Field ID: `client_name`
- Source reference: `d14d6746-63af-471e-a27f-0e59656de688`
- Input: `text`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_name`

#### 8. Date of Birth

- Field ID: `a1_date_of_birth`
- Source reference: `8992ba69-2abf-4716-bfae-c28e26ed63f5`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 9. Gender

- Field ID: `a1_gender`
- Source reference: `9a04d88d-b9ad-42f4-8b44-61139e8e863a`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 10. Phone Number

- Field ID: `client_phone`
- Source reference: `744402b6-3ea1-438d-ba80-a5fc07252bbe`
- Input: `tel`; required: **No**
- Field visibility: No additional condition.
- Client identity role: `client_phone`

#### 11. Email

- Field ID: `client_email`
- Source reference: `6b5a6b0a-0961-43ba-9759-5ea6519ff6eb`
- Input: `email`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_email`

#### 12. Address

- Field ID: `a1_address`
- Source reference: `78d2f25c-dcdc-45bc-b64b-a04aeef84521`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 13. Date you moved into your current address (DD/MM/YYYY)

- Field ID: `a1_date_you_moved_into_your_current_address_dd_mm_y`
- Source reference: `a1_curr_moved_in`
- Input: `date`; required: **Yes**
- Field visibility: No additional condition.

#### 14. Residency status of your current address

- Field ID: `a1_residency_status_of_your_current_address`
- Source reference: `a1_curr_residency`
- Input: `radio`; required: **Yes**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Owner → `owner`
- Rented → `rented`
- Living with friends or family → `living_with_friends_or_family`

#### 15. If you have lived here less than 3 years: previous address

- Field ID: `a1_if_you_have_lived_here_less_than_3_years_previou`
- Source reference: `a1_prev_address`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 16. Previous address: date you moved in (DD/MM/YYYY)

- Field ID: `a1_previous_address_date_you_moved_in_dd_mm_yyyy`
- Source reference: `a1_prev_moved_in`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 17. Previous address: date you moved out (DD/MM/YYYY)

- Field ID: `a1_previous_address_date_you_moved_out_dd_mm_yyyy`
- Source reference: `a1_prev_moved_out`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 18. Residency status of your previous address

- Field ID: `a1_residency_status_of_your_previous_address`
- Source reference: `a1_prev_residency`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Owner → `owner`
- Rented → `rented`
- Living with friends or family → `living_with_friends_or_family`

#### 19. Marital Status

- Field ID: `a1_marital_status`
- Source reference: `82715da2-a108-4f8d-abaf-d66e991b75b4`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

**Group heading:** Applicant 1 Health Details

#### 20. Smoker/Vaper status (include amount/vape)

- Field ID: `a1_health_smoker_vaper_status_include_amount_vape`
- Source reference: `8b5bf429-f437-4890-806f-8720436dd3ae`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 21. Height

- Field ID: `a1_health_height`
- Source reference: `1e8f132f-3c67-472a-9446-91ea4d56a3df`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 22. Weight

- Field ID: `a1_health_weight`
- Source reference: `ea631859-99c9-4d60-8403-78d40aa425f7`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 23. Have you had any serious health issues in the past which may stop you from getting insurance? (Cancer, Heart Attack, Stroke, M.S, etc)

- Field ID: `a1_health_have_you_had_any_serious_health_issues_in_the_pa`
- Source reference: `71c3ff76-35c0-4f8a-884d-47a3e30855f1`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 24. Nationality

- Field ID: `a1_health_nationality`
- Source reference: `baa22df7-0ccf-42d7-81aa-29a2316fa8b9`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 25. Were you born in the UK?

- Field ID: `a1_health_were_you_born_in_the_uk`
- Source reference: `a1_born_uk`
- Input: `yesno`; required: **Yes**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 26. If no, what date did you come to the UK? (DD/MM/YYYY)

- Field ID: `a1_health_if_no_what_date_did_you_come_to_the_uk_dd_mm_yyy`
- Source reference: `a1_came_to_uk`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 27. Is this a joint case?

- Field ID: `joint_case`
- Source reference: `2772f172-e77f-498a-98ac-c325f22b0c84`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

### Applicant 2 Details

Section ID: `s5_applicant_2_details`.

Section visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

**Group heading:** Applicant 2 Details

#### 28. Title

- Field ID: `a2_title`
- Source reference: `de62e4ce-791f-4366-86b2-e7b52f1d2125`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 29. Full Name

- Field ID: `a2_full_name`
- Source reference: `40defd5c-7db2-40b0-a726-f2b918f377c8`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 30. Date of Birth

- Field ID: `a2_date_of_birth`
- Source reference: `05049236-45c8-4b0b-ac4c-37ac18482ab3`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 31. Gender

- Field ID: `a2_gender`
- Source reference: `a4be987a-dc61-4321-9167-3f89f26a07ff`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 32. Address

- Field ID: `a2_address`
- Source reference: `4166171c-42ed-4806-83c6-e26c7d8ece90`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 33. Date you moved into your current address (DD/MM/YYYY)

- Field ID: `a2_date_you_moved_into_your_current_address_dd_mm_y`
- Source reference: `a2_curr_moved_in`
- Input: `date`; required: **Yes**
- Field visibility: No additional condition.

#### 34. Residency status of your current address

- Field ID: `a2_residency_status_of_your_current_address`
- Source reference: `a2_curr_residency`
- Input: `radio`; required: **Yes**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Owner → `owner`
- Rented → `rented`
- Living with friends or family → `living_with_friends_or_family`

#### 35. If you have lived here less than 3 years: previous address

- Field ID: `a2_if_you_have_lived_here_less_than_3_years_previou`
- Source reference: `a2_prev_address`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 36. Previous address: date you moved in (DD/MM/YYYY)

- Field ID: `a2_previous_address_date_you_moved_in_dd_mm_yyyy`
- Source reference: `a2_prev_moved_in`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 37. Previous address: date you moved out (DD/MM/YYYY)

- Field ID: `a2_previous_address_date_you_moved_out_dd_mm_yyyy`
- Source reference: `a2_prev_moved_out`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 38. Residency status of your previous address

- Field ID: `a2_residency_status_of_your_previous_address`
- Source reference: `a2_prev_residency`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Owner → `owner`
- Rented → `rented`
- Living with friends or family → `living_with_friends_or_family`

#### 39. Phone Number

- Field ID: `a2_phone_number`
- Source reference: `ffc28eef-eabb-4e49-bf7e-6b930b9143bd`
- Input: `tel`; required: **No**
- Field visibility: No additional condition.

#### 40. Email

- Field ID: `a2_email`
- Source reference: `5d307b08-5cea-4b55-8aae-6b4d65f84965`
- Input: `email`; required: **No**
- Field visibility: No additional condition.

#### 41. Marital Status

- Field ID: `a2_marital_status`
- Source reference: `540d30c7-959d-47ff-aaf4-b8f72d9a7c9b`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

**Group heading:** Applicant 2 Health Details

#### 42. Smoker/Vaper status (include amount/vape)

- Field ID: `a2_health_smoker_vaper_status_include_amount_vape`
- Source reference: `8bf2cc0e-ed33-400f-b432-95828c85f2d4`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 43. Height

- Field ID: `a2_health_height`
- Source reference: `95fa1837-4ad7-4b44-aa09-ed7be20bb2fe`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 44. Weight

- Field ID: `a2_health_weight`
- Source reference: `95611eea-7e27-4b0f-bc23-b64036ff85ca`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 45. Have you had any serious health issues in the past which may stop you from getting insurance? (Cancer, Heart Attack, Stroke, M.S, etc)

- Field ID: `a2_health_have_you_had_any_serious_health_issues_in_the_pa`
- Source reference: `34dbeb5c-7ae9-4dec-b2a2-61b4abd3dc99`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 46. Nationality

- Field ID: `a2_health_nationality`
- Source reference: `566b698a-c3c1-45a4-8be3-11aa7531ad96`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 47. Were you born in the UK?

- Field ID: `a2_health_were_you_born_in_the_uk`
- Source reference: `a2_born_uk`
- Input: `yesno`; required: **Yes**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 48. If no, what date did you come to the UK? (DD/MM/YYYY)

- Field ID: `a2_health_if_no_what_date_did_you_come_to_the_uk_dd_mm_yyy`
- Source reference: `a2_came_to_uk`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

### Dependants

Section ID: `s6_dependants`.

Section visibility: Always available.

#### 49. Do you have children or dependants?

- Field ID: `has_dependants`
- Source reference: `3ce63c97-f454-40f6-8de9-031eb984dc57`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

**Group heading:** Children & Dependent Details

#### 50. Child Name

- Field ID: `dep_child_name`
- Source reference: `b2071b18-adfa-47fe-8909-ddb2d97dec9b`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 51. Child date of birth (DD/MM/YYYY)

- Field ID: `dep_child_date_of_birth_dd_mm_yyyy`
- Source reference: `dep_child_dob`
- Input: `date`; required: **Yes**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 52. Child Gender

- Field ID: `dep_child_gender`
- Source reference: `d3fe1535-8b0b-4d80-a4d7-8da72c210485`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 53. Relationship to Client

- Field ID: `dep_relationship_to_client`
- Source reference: `d45e2cf2-8ee6-4bf7-aeae-29820044aef1`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 54. Dependent on (Applicant 1, Applicant 2 or Both)

- Field ID: `dep_dependent_on_applicant_1_applicant_2_or_both`
- Source reference: `03959efd-f4ba-47a0-9e1f-388f4fbd58dc`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 55. Your children will be dependant on you until what age?

- Field ID: `dep_your_children_will_be_dependant_on_you_until_wha`
- Source reference: `46836821-2fd5-4ec1-9460-8626ffa93219`
- Input: `number`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 56. If you have any more children, please provide details below for ALL children.

- Field ID: `if_you_have_any_more_children_please_provide_det`
- Source reference: `7f479f50-73ee-4077-9a0b-cdfacb7fc475`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

Help text:

> Child name, Gender, Relationship to client(s), D.O.B, Dependant until what age

### Employment Info

Section ID: `s7_employment_info`.

Section visibility: Always available.

**Group heading:** Applicant 1 Employment Status

#### 57. Applicant 1 Employment Status

- Field ID: `a1_emp_status`
- Source reference: `862b5102-e00c-4ab0-9027-507f3c6d28d1`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Employed → `employed`
- Self Employed → `self_employed`
- Unemployed → `unemployed`
- Retired → `retired`

Original Typeform question title before the documented label repair:

> ...

#### 58. Applicant 1 Occupation

- Field ID: `a1_emp_applicant_1_occupation`
- Source reference: `5f70feba-8632-4505-a277-3d3eca042083`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 59. Applicant 1 Job Title

- Field ID: `a1_emp_applicant_1_job_title`
- Source reference: `a1_job_title`
- Input: `text`; required: **Yes**
- Field visibility: No additional condition.

#### 60. Applicant 1 Employer Name

- Field ID: `a1_emp_applicant_1_employer_name`
- Source reference: `68e7d428-97d6-4c23-a9d5-42089cd29333`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 61. Applicant 1 Full time or part time?

- Field ID: `a1_emp_applicant_1_full_time_or_part_time`
- Source reference: `0b2a713d-96c9-49fc-9317-8e42730aa9a1`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 62. Applicant 1 Start of employment date (or company setup date for self employed)

- Field ID: `a1_emp_applicant_1_start_of_employment_date_or_company`
- Source reference: `a69525e2-f1cd-4147-8562-f28e811adee8`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 63. If you have worked there less than 2 years please enter previous employers details below

- Field ID: `if_you_have_worked_there_less_than_2_years_pleas`
- Source reference: `f060617e-6c71-4fe5-b256-6c6f0f645468`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

Help text:

> Company name, Job title, Start and end date, Income/salary

**Group heading:** Applicant 1 Employment Info

#### 64. Applicant 1 Gross Annual Pay

- Field ID: `a1_pay_applicant_1_gross_annual_pay`
- Source reference: `c8eecb7a-0d8d-4dd0-ac59-87a11976b1a0`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 65. Applicant 1 Net Monthly Pay

- Field ID: `a1_pay_applicant_1_net_monthly_pay`
- Source reference: `760b997d-c444-4180-a8f4-5e53a1753df6`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 66. Applicant 1 Benefits received

- Field ID: `a1_pay_applicant_1_benefits_received`
- Source reference: `76c91928-3deb-41ba-964b-0eaa956d1bc1`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 67. Applicant 1 Anticipated Retirement Age

- Field ID: `a1_pay_applicant_1_anticipated_retirement_age`
- Source reference: `b90ddec8-0efb-44e2-aba3-b72bb8d636f3`
- Input: `number`; required: **No**
- Field visibility: No additional condition.

#### 68. Please state any additional income below (Applicant 1).

- Field ID: `a1_pay_please_state_any_additional_income_below_applica`
- Source reference: `560bbe46-7a7e-4e59-89af-cf2ccee24559`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

**Group heading:** Applicant 2 Employment Status

#### 69. Applicant 2 Employment Status

- Field ID: `a2_emp_applicant_2_employment_status`
- Source reference: `ccb7ec79-f464-4721-9a58-dad205958576`
- Input: `select`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Choices (label → stored value), in display order:

- Employed → `employed`
- Self Employed → `self_employed`
- Unemployed → `unemployed`
- Retired → `retired`

#### 70. Applicant 2 Occupation

- Field ID: `a2_emp_applicant_2_occupation`
- Source reference: `4a188241-7270-4d0c-9bf9-12501dc693f0`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 71. Applicant 2 Job Title

- Field ID: `a2_emp_applicant_2_job_title`
- Source reference: `a2_job_title`
- Input: `text`; required: **Yes**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 72. Applicant 2 Employer Name

- Field ID: `a2_emp_applicant_2_employer_name`
- Source reference: `4ac2541e-1e1c-4db6-9497-13a4698b88c5`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 73. Applicant 2 Full time or part time?

- Field ID: `a2_emp_applicant_2_full_time_or_part_time`
- Source reference: `d4301991-c1e0-44ad-b565-613fcbdf1839`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 74. Applicant 2 Start of employment date (or company setup date for self employed)

- Field ID: `a2_emp_applicant_2_start_of_employment_date_or_company`
- Source reference: `950d5f2d-0211-48be-9ed5-191e20a0f470`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 75. If you have worked there less than 2 years please enter previous employers details below

- Field ID: `if_you_have_worked_there_less_than_2_years_pleas_2`
- Source reference: `e791c1ed-5eb8-45ea-8bde-b07c527e44ad`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Company name
> Job title
> Start and end date
> Income/salary

**Group heading:** Applicant 2 Employment Info

#### 76. Applicant 2 Gross Annual Pay

- Field ID: `a2_pay_applicant_2_gross_annual_pay`
- Source reference: `9ab7b402-31b3-4802-af32-4cbca7ac5adc`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 77. Applicant 2 Net Monthly Pay

- Field ID: `a2_pay_applicant_2_net_monthly_pay`
- Source reference: `96d7bd9e-9870-4f57-9453-bc2d8f691eca`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 78. Applicant 2 Benefits received

- Field ID: `a2_pay_applicant_2_benefits_received`
- Source reference: `8a10e121-99c3-49bb-9fba-c7da4bfe32ff`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 79. Applicant 2 Anticipated Retirement Age

- Field ID: `a2_pay_applicant_2_anticipated_retirement_age`
- Source reference: `a3a042f4-2588-40e1-b550-a752af2a9c1a`
- Input: `number`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 80. Please state any additional income below (Applicant 2).

- Field ID: `a2_pay_please_state_any_additional_income_below_applica`
- Source reference: `73d1e4bb-df8a-4fde-809f-489e3ed78c54`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

### Monthly Expenditure

Section ID: `s8_monthly_expenditure`.

Section visibility: Always available.

**Group heading:** Monthly Expenses

#### 81. Rent or Mortgage (monthly)

- Field ID: `exp_rent_or_mortgage_monthly`
- Source reference: `13d128ef-a93a-4f61-a77f-ca974f514d99`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 82. Utilities (monthly)

- Field ID: `exp_utilities_monthly`
- Source reference: `ea658fdf-84d2-4bf9-ab4b-10f5322d4838`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 83. Food and Clothing (monthly)

- Field ID: `exp_food_and_clothing_monthly`
- Source reference: `2347bf5b-ef5b-43fb-ba97-d90f5d15463b`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 84. Council Tax (monthly)

- Field ID: `exp_council_tax_monthly`
- Source reference: `9b44c65e-bae6-481c-a624-82eaccd3414d`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 85. Other Insurances (monthly)

- Field ID: `exp_other_insurances_monthly`
- Source reference: `69a22d5c-0f9b-4c44-bf02-87bd0a876800`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 86. Child maintenance (monthly)

- Field ID: `exp_child_maintenance_monthly`
- Source reference: `5b5a9e57-bdb2-472a-9c91-6474b3d81cf0`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 87. Mobile (monthly)

- Field ID: `exp_mobile_monthly`
- Source reference: `1c50a91e-bc81-4e8e-8ab9-a66d19c1af1e`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 88. Motoring (monthly)

- Field ID: `exp_motoring_monthly`
- Source reference: `80eea8ec-1a22-4878-a0ad-d9283b41fb8a`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 89. Other Expenditure (monthly)

- Field ID: `exp_other_expenditure_monthly`
- Source reference: `360b3eee-e54a-4ea6-a6c2-870e51ef6b51`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 90. Approx Total Monthly Expenditure

- Field ID: `exp_approx_total_monthly_expenditure`
- Source reference: `2aed8411-2f0c-4f58-9585-2408679366c6`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 91. Have you ever had a CCJ?

- Field ID: `has_ccj`
- Source reference: `8d1e0757-775a-4d9e-a8be-dd2102410555`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

**Group heading:** CCJ information below

#### 92. Company name

- Field ID: `ccj_company_name`
- Source reference: `6af23774-1835-40ec-bb90-d8e9a501205e`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_ccj","operator":"eq","value":"yes"}`

#### 93. CCJ amount

- Field ID: `ccj_ccj_amount`
- Source reference: `437c23e9-74b6-4a1f-bf75-ccde3490fa16`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"has_ccj","operator":"eq","value":"yes"}`

#### 94. Date of CCJ and when it was discharged

- Field ID: `ccj_date_of_ccj_and_when_it_was_discharged`
- Source reference: `cf2a1e0a-1193-4777-a36b-6758b0efc425`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_ccj","operator":"eq","value":"yes"}`

#### 95. How many months missed

- Field ID: `ccj_how_many_months_missed`
- Source reference: `06f8a70d-4e75-462b-ac05-e9b6659cf59d`
- Input: `number`; required: **No**
- Field visibility: `{"field":"has_ccj","operator":"eq","value":"yes"}`

#### 96. Have you ever been made bankrupt?

- Field ID: `has_bankruptcy`
- Source reference: `482f4f17-853b-416a-bc27-2359b86f4810`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

**Group heading:** Bankruptcy info

#### 97. Date of Bankruptcy and discharge.

- Field ID: `bk_date_of_bankruptcy_and_discharge`
- Source reference: `7b0fa519-6ba3-4e8e-903a-d87f88aa4f4f`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_bankruptcy","operator":"eq","value":"yes"}`

#### 98. Is it spent?

- Field ID: `bk_is_it_spent`
- Source reference: `548e0cba-ea24-4f44-a1d0-0f5a3ef4cbec`
- Input: `yesno`; required: **No**
- Field visibility: `{"field":"has_bankruptcy","operator":"eq","value":"yes"}`

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

### Mortgage Info

Section ID: `s9_mortgage_info`.

Section visibility: Always available.

#### 99. Is this a purchase or a remortgage?

- Field ID: `mortgage_type`
- Source reference: `e730ad61-aefe-4a7c-87be-97d3c6ed2d32`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Purchase → `purchase`
- Remortgage → `remortgage`

**Group heading:** Mortgage purchase

#### 100. Purchase amount

- Field ID: `purchase_purchase_amount`
- Source reference: `e8c39cff-a13b-4e28-85b0-8c0da0d7744d`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 101. Purchase address

- Field ID: `purchase_purchase_address`
- Source reference: `0ad97821-b4b3-4c1d-8acc-94b47eb0ab56`
- Input: `text`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 102. Source of deposit

- Field ID: `purchase_source_of_deposit`
- Source reference: `61ec7b09-c9d8-48f9-9c0b-63a9aae28985`
- Input: `text`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 103. Property type

- Field ID: `purchase_property_type`
- Source reference: `b2b06d86-1f6e-4e99-abb6-b80c4a311dba`
- Input: `select`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

Choices (label → stored value), in display order:

- Detached → `detached`
- Semi Detached → `semi_detached`
- Terraced → `terraced`
- End of terrace → `end_of_terrace`
- Flat → `flat`
- Bungalow → `bungalow`
- Other → `other`

#### 104. Tenure

- Field ID: `purchase_property_type_2`
- Source reference: `ef1d9316-9550-4e1e-bf05-8f84c0abb98f`
- Input: `radio`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

Choices (label → stored value), in display order:

- Freehold → `freehold`
- Leasehold → `leasehold`

Original Typeform question title before the documented label repair:

> Property Type

#### 105. Year of build

- Field ID: `purchase_year_of_build`
- Source reference: `7427873d-3a63-4c31-b07d-266a0253789f`
- Input: `number`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 106. Type of construction

- Field ID: `purchase_type_of_construction`
- Source reference: `e1d89d1e-cdb9-4dd1-909d-4c5633ed473e`
- Input: `select`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

Choices (label → stored value), in display order:

- Standard → `standard`
- Non standard → `non_standard`
- Other → `other`

#### 107. Number of bedrooms

- Field ID: `purchase_number_of_bedrooms`
- Source reference: `e1a84876-88d2-4ff2-af62-621469aed014`
- Input: `number`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 108. Number of bathrooms

- Field ID: `purchase_number_of_bathrooms`
- Source reference: `5c9c51da-7a92-4f0e-af42-947a65044be7`
- Input: `number`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 109. Estate agents details

- Field ID: `purchase_estate_agents_details`
- Source reference: `0a9f6a27-c8f7-4f4d-b9db-352962784c82`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 110. Solicitor's details

- Field ID: `purchase_solicitor_s_details`
- Source reference: `mort_solicitor`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

#### 111. Any other relevant information

- Field ID: `purchase_any_other_relevant_information`
- Source reference: `a02a2244-ee5b-431b-bf35-a3696de5aee9`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"purchase"}`

**Group heading:** Remortgage

#### 112. Estimated value

- Field ID: `remortgage_estimated_value`
- Source reference: `33cd2ed1-043b-4763-a92f-408c2a739502`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 113. Address of the mortgage property

- Field ID: `remortgage_address_of_the_mortgage_property`
- Source reference: `remort_property_address`
- Input: `text`; required: **Yes**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 114. Current mortgage account number

- Field ID: `remortgage_current_mortgage_account_number`
- Source reference: `remort_account_no`
- Input: `text`; required: **Yes**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 115. If leasehold, remaining term of lease

- Field ID: `remortgage_if_leasehold_remaining_term_of_lease`
- Source reference: `remort_lease_term`
- Input: `text`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 116. Outstanding loan amount

- Field ID: `remortgage_outstanding_loan_amount`
- Source reference: `eda1488a-2a02-44d0-bfb4-c51830e92e1d`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 117. Current lender

- Field ID: `remortgage_current_lender`
- Source reference: `c13a4fc5-348c-4c64-b820-742aba67b859`
- Input: `text`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 118. Current interest rate

- Field ID: `remortgage_current_interest_rate`
- Source reference: `06b3cca2-ee2b-4746-9000-98ebaf1ed6d4`
- Input: `percent`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 119. End of fixed rate

- Field ID: `remortgage_end_of_fixed_rate`
- Source reference: `7f2a68a0-29db-48dc-94e4-bcac300c2acb`
- Input: `text`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 120. Property type

- Field ID: `remortgage_property_type`
- Source reference: `6fda05cb-beb1-41e9-8924-8d688ec38e57`
- Input: `select`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

Choices (label → stored value), in display order:

- Detached → `detached`
- Semi Detached → `semi_detached`
- Terraced → `terraced`
- End of terrace → `end_of_terrace`
- Flat → `flat`
- Bungalow → `bungalow`
- Other → `other`

#### 121. Tenure

- Field ID: `remortgage_property_type_2`
- Source reference: `0a477473-93c0-49ac-a868-57ae34a8c481`
- Input: `radio`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

Choices (label → stored value), in display order:

- Freehold → `freehold`
- Leasehold → `leasehold`

Original Typeform question title before the documented label repair:

> Property Type

#### 122. Year of build

- Field ID: `remortgage_year_of_build`
- Source reference: `ca0b8555-a9b8-4f8c-ba64-fbdaf53f0a3e`
- Input: `number`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 123. Type of construction

- Field ID: `remortgage_type_of_construction`
- Source reference: `cd7d3194-8356-4ff7-9b5d-6a2816d5d007`
- Input: `select`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

Choices (label → stored value), in display order:

- Standard → `standard`
- Non standard → `non_standard`
- Other → `other`

#### 124. Number of bedrooms

- Field ID: `remortgage_number_of_bedrooms`
- Source reference: `9a6f8b82-ed3f-4250-8507-4776f41c7b67`
- Input: `number`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 125. Number of bathrooms

- Field ID: `remortgage_number_of_bathrooms`
- Source reference: `3c012369-9d65-49e5-9b99-b4c9664b66ca`
- Input: `number`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 126. Any other relevant information

- Field ID: `remortgage_any_other_relevant_information`
- Source reference: `eb608365-f03a-4ce8-9c42-a80599b80caf`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"mortgage_type","operator":"eq","value":"remortgage"}`

#### 127. Do you have any background buy-to-let properties?

- Field ID: `has_btl`
- Source reference: `btl_has`
- Input: `yesno`; required: **Yes**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 128. If yes, how many?

- Field ID: `btl_count`
- Source reference: `btl_count`
- Input: `select`; required: **No**
- Field visibility: `{"field":"has_btl","operator":"eq","value":"yes"}`

Choices (label → stored value), in display order:

- 1 → `1`
- 2 → `2`
- 3 → `3`

**Group heading:** Buy-to-let property 1

#### 129. Estimated value

- Field ID: `btl1_estimated_value`
- Source reference: `9b3070a3-da52-4cb6-9c36-44b996f8b2b0`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 130. Address of the mortgage property

- Field ID: `btl1_address_of_the_mortgage_property`
- Source reference: `a1b2eb65-8793-4f3b-90d9-920a433cf087`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 131. Current mortgage account number

- Field ID: `btl1_current_mortgage_account_number`
- Source reference: `8d0a5ebb-5d46-497a-8d49-3cfd383c7b42`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 132. If leasehold, remaining term of lease

- Field ID: `btl1_if_leasehold_remaining_term_of_lease`
- Source reference: `d52ed878-62b8-41f6-8be9-3e6a230529ca`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 133. Outstanding loan amount

- Field ID: `btl1_outstanding_loan_amount`
- Source reference: `8b42dc09-2c92-4ea7-8b31-2961e045b5b1`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 134. Current lender

- Field ID: `btl1_current_lender`
- Source reference: `afc79edc-b2ff-4db9-bcbc-b9fe931dc7d0`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 135. Current interest rate

- Field ID: `btl1_current_interest_rate`
- Source reference: `5631d14b-01b8-4072-94fd-bddb522d2bc0`
- Input: `percent`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 136. End of fixed rate

- Field ID: `btl1_end_of_fixed_rate`
- Source reference: `89f3ba90-8951-40d1-9400-27631f0ad50a`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 137. Property type

- Field ID: `btl1_property_type`
- Source reference: `9f6471f6-aa0c-40c8-95c9-eb9011943d5e`
- Input: `select`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

Choices (label → stored value), in display order:

- Detached → `detached`
- Semi Detached → `semi_detached`
- Terraced → `terraced`
- End of terrace → `end_of_terrace`
- Flat → `flat`
- Bungalow → `bungalow`
- Other → `other`

#### 138. Tenure

- Field ID: `btl1_property_type_2`
- Source reference: `fbf67122-4d95-4e86-9761-a201cf1d2ff5`
- Input: `radio`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

Choices (label → stored value), in display order:

- Freehold → `freehold`
- Leasehold → `leasehold`

Original Typeform question title before the documented label repair:

> Property Type

#### 139. Year of build

- Field ID: `btl1_year_of_build`
- Source reference: `7cd9dc1f-8e66-49d2-a0dc-6044c49ac94c`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 140. Type of construction

- Field ID: `btl1_type_of_construction`
- Source reference: `c83066f6-cee5-4ddc-a137-69ef1424c6b8`
- Input: `select`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

Choices (label → stored value), in display order:

- Standard → `standard`
- Non standard → `non_standard`
- Other → `other`

#### 141. Number of bedrooms

- Field ID: `btl1_number_of_bedrooms`
- Source reference: `8782d161-3f72-4af8-84e6-a08dc42a4ceb`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 142. Number of bathrooms

- Field ID: `btl1_number_of_bathrooms`
- Source reference: `2f3fc17a-18f3-43ee-b83a-ca94ed3c890a`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 143. Any other relevant information

- Field ID: `btl1_any_other_relevant_information`
- Source reference: `f7cc8ce2-defe-4abe-ad31-f38404b1c01b`
- Input: `textarea`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 144. BTL 1: address of property

- Field ID: `btl1_btl_1_address_of_property`
- Source reference: `1a795b27-129a-433e-910c-7b5dfe7df3b8`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 145. BTL 1: current mortgage account number

- Field ID: `btl1_btl_1_current_mortgage_account_number`
- Source reference: `c055bb3f-501f-41fd-a5a5-871b3d4c8614`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 146. BTL 1: if leasehold, remaining term of lease

- Field ID: `btl1_btl_1_if_leasehold_remaining_term_of_lease`
- Source reference: `1be67a03-da89-4fce-999d-47924c21db3a`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

#### 147. BTL 1: monthly rental income received

- Field ID: `btl1_btl_1_monthly_rental_income_received`
- Source reference: `c62fb0d9-934e-44b1-90eb-58c2af5ec2fe`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["1","2","3"]}]}`

**Group heading:** Buy-to-let property 2

#### 148. Estimated value

- Field ID: `btl2_estimated_value`
- Source reference: `a5d9cbe6-335a-45fb-8215-f5fe668d86ed`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 149. Address of the mortgage property

- Field ID: `btl2_address_of_the_mortgage_property`
- Source reference: `21a36461-b730-4d09-a844-6c41b6e5aab1`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 150. Current mortgage account number

- Field ID: `btl2_current_mortgage_account_number`
- Source reference: `02a8a253-f63a-46e1-bc34-1ddd2c5bc698`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 151. If leasehold, remaining term of lease

- Field ID: `btl2_if_leasehold_remaining_term_of_lease`
- Source reference: `07de44e7-ea76-468d-870f-87a6b9924529`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 152. Outstanding loan amount

- Field ID: `btl2_outstanding_loan_amount`
- Source reference: `7b62124d-d8f7-4832-ad62-2a207d418484`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 153. Current lender

- Field ID: `btl2_current_lender`
- Source reference: `4a09639d-5883-43c1-8d93-993407768367`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 154. Current interest rate

- Field ID: `btl2_current_interest_rate`
- Source reference: `48a3f29d-da28-4a45-8d9e-a2f423614481`
- Input: `percent`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 155. End of fixed rate

- Field ID: `btl2_end_of_fixed_rate`
- Source reference: `d2ded01a-a32a-463e-bc22-ea886459b57a`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 156. Property type

- Field ID: `btl2_property_type`
- Source reference: `52a736ac-c38b-44a5-a72d-457676334460`
- Input: `select`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

Choices (label → stored value), in display order:

- Detached → `detached`
- Semi Detached → `semi_detached`
- Terraced → `terraced`
- End of terrace → `end_of_terrace`
- Flat → `flat`
- Bungalow → `bungalow`
- Other → `other`

#### 157. Tenure

- Field ID: `btl2_property_type_2`
- Source reference: `cbced12f-70fe-46db-990c-5e4130aeec6f`
- Input: `radio`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

Choices (label → stored value), in display order:

- Freehold → `freehold`
- Leasehold → `leasehold`

Original Typeform question title before the documented label repair:

> Property Type

#### 158. Year of build

- Field ID: `btl2_year_of_build`
- Source reference: `378c79a2-adaf-4239-af6f-4061bef6290e`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 159. Type of construction

- Field ID: `btl2_type_of_construction`
- Source reference: `ecf4de53-1282-4a0b-912a-38669102a772`
- Input: `select`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

Choices (label → stored value), in display order:

- Standard → `standard`
- Non standard → `non_standard`
- Other → `other`

#### 160. Number of bedrooms

- Field ID: `btl2_number_of_bedrooms`
- Source reference: `40a12bbf-e259-4682-a267-aacdb0f74d01`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 161. Number of bathrooms

- Field ID: `btl2_number_of_bathrooms`
- Source reference: `dca1442b-35d6-42b0-bdba-584bbfecbac6`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 162. Any other relevant information

- Field ID: `btl2_any_other_relevant_information`
- Source reference: `5cd82966-9406-464e-8088-775c498176d8`
- Input: `textarea`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 163. BTL 2: address of property

- Field ID: `btl2_btl_2_address_of_property`
- Source reference: `d9c82564-1813-4361-a1f5-6e71f2fd2ff1`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 164. BTL 2: current mortgage account number

- Field ID: `btl2_btl_2_current_mortgage_account_number`
- Source reference: `556e00c3-c055-4417-bcf6-d2746fbc2d19`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 165. BTL 2: if leasehold, remaining term of lease

- Field ID: `btl2_btl_2_if_leasehold_remaining_term_of_lease`
- Source reference: `12c761fd-edb5-4e5c-8af0-6fdcddc47b86`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

#### 166. BTL 2: monthly rental income received

- Field ID: `btl2_btl_2_monthly_rental_income_received`
- Source reference: `f2d612d0-fd20-42ec-99cf-14576a0f0683`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["2","3"]}]}`

**Group heading:** Buy-to-let property 3

#### 167. Estimated value

- Field ID: `btl3_estimated_value`
- Source reference: `3173279e-3f73-4af8-a6b7-7b2502d24db6`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 168. Address of the mortgage property

- Field ID: `btl3_address_of_the_mortgage_property`
- Source reference: `5d30b4b1-ae66-41d5-8de4-db0af957d17e`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 169. Current mortgage account number

- Field ID: `btl3_current_mortgage_account_number`
- Source reference: `b023ec30-c9cb-45ae-9b82-144b7a11f85f`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 170. If leasehold, remaining term of lease

- Field ID: `btl3_if_leasehold_remaining_term_of_lease`
- Source reference: `cb8b3e31-19f9-451a-af4f-450673f65e2a`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 171. Outstanding loan amount

- Field ID: `btl3_outstanding_loan_amount`
- Source reference: `0e036182-8892-462c-ac24-5e3cb9dff8c3`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 172. Current lender

- Field ID: `btl3_current_lender`
- Source reference: `d8f9681f-6d3c-455e-b198-15a4137e2243`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 173. Current interest rate

- Field ID: `btl3_current_interest_rate`
- Source reference: `473172be-3a35-452b-be30-3df96c72d504`
- Input: `percent`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 174. End of fixed rate

- Field ID: `btl3_end_of_fixed_rate`
- Source reference: `da8a06e4-2c73-48d1-bdb0-8ad0514bc74f`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 175. Property type

- Field ID: `btl3_property_type`
- Source reference: `dfd430bd-431a-40dc-951c-44d16dd288d0`
- Input: `select`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

Choices (label → stored value), in display order:

- Detached → `detached`
- Semi Detached → `semi_detached`
- Terraced → `terraced`
- End of terrace → `end_of_terrace`
- Flat → `flat`
- Bungalow → `bungalow`
- Other → `other`

#### 176. Tenure

- Field ID: `btl3_property_type_2`
- Source reference: `8ec12003-08cc-48b1-85b5-f5afb455f7d1`
- Input: `radio`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

Choices (label → stored value), in display order:

- Freehold → `freehold`
- Leasehold → `leasehold`

Original Typeform question title before the documented label repair:

> Property Type

#### 177. Year of build

- Field ID: `btl3_year_of_build`
- Source reference: `e3dee114-ecb8-434f-b7f9-7ea47b9aada7`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 178. Type of construction

- Field ID: `btl3_type_of_construction`
- Source reference: `c8da30c7-9af7-4ca9-b090-63dc45cfc916`
- Input: `select`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

Choices (label → stored value), in display order:

- Standard → `standard`
- Non standard → `non_standard`
- Other → `other`

#### 179. Number of bedrooms

- Field ID: `btl3_number_of_bedrooms`
- Source reference: `f3bb1f1f-7d83-4395-b1a9-ba4cc7a5c453`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 180. Number of bathrooms

- Field ID: `btl3_number_of_bathrooms`
- Source reference: `f6ce7828-11f2-4a69-91aa-84aecb7acf87`
- Input: `number`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 181. Any other relevant information

- Field ID: `btl3_any_other_relevant_information`
- Source reference: `0686abbf-f24d-4087-88ea-3b38ebdd40b3`
- Input: `textarea`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 182. BTL 3: address of property

- Field ID: `btl3_btl_3_address_of_property`
- Source reference: `1f1ad7cf-e885-43ae-b554-cd62add842ee`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 183. BTL 3: current mortgage account number

- Field ID: `btl3_btl_3_current_mortgage_account_number`
- Source reference: `a8cb9e6c-e4ba-481f-b9e7-b1c4135d31a3`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 184. BTL 3: if leasehold, remaining term of lease

- Field ID: `btl3_btl_3_if_leasehold_remaining_term_of_lease`
- Source reference: `19b345e3-7dfb-4087-b86a-d8c142823848`
- Input: `text`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

#### 185. BTL 3: monthly rental income received

- Field ID: `btl3_btl_3_monthly_rental_income_received`
- Source reference: `2f1f5c13-e687-4591-adbf-65c388eba424`
- Input: `currency`; required: **No**
- Field visibility: `{"all":[{"field":"has_btl","operator":"eq","value":"yes"},{"field":"btl_count","operator":"in","value":["3"]}]}`

### Sick Pay Info

Section ID: `s10_sick_pay_info`.

Section visibility: Always available.

**Group heading:** Applicant 1

#### 186. Do you receive any sick pay?

- Field ID: `sp1_do_you_receive_any_sick_pay`
- Source reference: `132aa2d3-b65d-4c83-831d-430745cd68dd`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 187. If yes, How much sick pay do you receive?

- Field ID: `sp1_if_yes_how_much_sick_pay_do_you_receive`
- Source reference: `9589bb3a-0aa4-4013-ad8a-0a5419087aec`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

Help text:

> Monetary amount

#### 188. How long is sick pay received for?

- Field ID: `sp1_how_long_is_sick_pay_received_for`
- Source reference: `6e3b88b1-dc7b-4987-b85b-f3bf8621729e`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

#### 189. Do you have any savings or other income that would help you pay your monthly bills?

- Field ID: `sp1_do_you_have_any_savings_or_other_income_that_wou`
- Source reference: `cfa130f8-08a9-43c9-ac5d-1697423899c3`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

#### 190. If your income stopped but your bills continued. How long would you be able to pay your monthly bills for?

- Field ID: `sp1_if_your_income_stopped_but_your_bills_continued`
- Source reference: `36d9b5bb-e034-4d33-8c55-52b03e8f6a8c`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

#### 191. After your savings have run out, how long could you continue to pay your bills for, after this?

- Field ID: `sp1_after_your_savings_have_run_out_how_long_could_y`
- Source reference: `6b4229f6-f1d4-414c-9260-7eaac3f39a60`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

**Group heading:** Applicant 2

#### 192. Do you receive any sick pay?

- Field ID: `sp2_do_you_receive_any_sick_pay`
- Source reference: `6ead8dc9-6e20-4bba-8615-fe26aa1c2341`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 193. If yes, How much sick pay do you receive?

- Field ID: `sp2_if_yes_how_much_sick_pay_do_you_receive`
- Source reference: `97bf9b15-4b7e-4bdc-bfb1-79784f0671af`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Monetary amount

#### 194. How long is sick pay received for?

- Field ID: `sp2_how_long_is_sick_pay_received_for`
- Source reference: `d2f8e270-fadf-46cb-9805-10fc56f758dd`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

#### 195. Do you have any savings or other income that would help you pay your monthly bills?

- Field ID: `sp2_do_you_have_any_savings_or_other_income_that_wou`
- Source reference: `8e00a699-751b-4283-8a89-10b526396cd0`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

#### 196. If your income stopped but your bills continued. How long would you be able to pay your monthly bills for?

- Field ID: `sp2_if_your_income_stopped_but_your_bills_continued`
- Source reference: `40ff2361-f3f1-4a9b-bd87-2461dfbb3b2c`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

#### 197. After your savings have run out, how long could you continue to pay your bills for, after this?

- Field ID: `sp2_after_your_savings_have_run_out_how_long_could_y`
- Source reference: `a2538608-e855-4594-ad18-cdb3b2a6a596`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

### Current Protection

Section ID: `s11_current_protection`.

Section visibility: Always available.

**Group heading:** Current protection plans

#### 198. Do you have anything that pays out a lump sum upon death?

- Field ID: `prot_do_you_have_anything_that_pays_out_a_lump_sum_up`
- Source reference: `e4ea1924-aa5e-405e-9307-9c402244e3b3`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 199. Do you have anything that pays out a lump sum upon diagnosis of cancer, heart attack, stroke, M.S etc?

- Field ID: `prot_do_you_have_anything_that_pays_out_a_lump_sum_up_2`
- Source reference: `34658e91-9bd5-4a73-bde6-b43d45140ecb`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 200. Do you have anything that pays off your mortgage if either applicant was to die or get ill?

- Field ID: `prot_do_you_have_anything_that_pays_off_your_mortgage`
- Source reference: `a979fd62-81e8-4614-80c1-36805c343fdd`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`
- I don't have a mortgage → `i_don_t_have_a_mortgage`

#### 201. Do you have anything in place that pays your wage if you are unable to work due to an accident or sickness?

- Field ID: `prot_do_you_have_anything_in_place_that_pays_your_wag`
- Source reference: `fe94570c-3a3e-43ab-8d4d-1208f6a43e7f`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 202. Enter details of any existing policies you have.

- Field ID: `prot_do_you_have_anything_in_place_that_pays_your_wag_details`
- Source reference: `c74e921c-2396-4bd1-8151-8a7818b0e136`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

Help text:

> Insurance company, payout, term and monthly premium. If more than one enter all below.

**Group heading:** Pension information

#### 203. Do you have pensions or investments?

- Field ID: `pension_do_you_have_pensions_or_investments`
- Source reference: `b4ae0ff1-3bac-4c4e-989e-46c3002b49ac`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 204. Have your pensions/investments been reviewed?

- Field ID: `pension_have_your_pensions_investments_been_reviewed`
- Source reference: `9b885d5a-7ef8-4994-9984-51517918a1cb`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 205. Are you happy with your pensions/investments?

- Field ID: `pension_are_you_happy_with_your_pensions_investments`
- Source reference: `d9f74a72-14c2-4ae2-af3a-b2739d174746`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 206. Do you have a will?

- Field ID: `pension_has_will`
- Source reference: `361f54d4-5991-48ed-92f3-660f43cc8a85`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 207. Do you understand the consequences if you don't have a will?

- Field ID: `pension_do_you_understand_the_consequences_if_you_don_t`
- Source reference: `af32757d-08b0-4644-8fbc-b94f9599a116`
- Input: `yesno`; required: **No**
- Field visibility: `{"field":"pension_has_will","operator":"eq","value":"no"}`

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 208. Are you concerned about care fees?

- Field ID: `pension_are_you_concerned_about_care_fees`
- Source reference: `0b99a5c7-4cb3-4669-b197-b19d7b92f0eb`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

### Additional Services

Section ID: `s12_additional_services`.

Section visibility: Always available.

#### 209. Is there anything specific that you would like your adviser to look at to protect you and your family?

- Field ID: `is_there_anything_specific_that_you_would_like_y`
- Source reference: `65c5c695-42e2-40ed-b5c4-57a5de6ae3f3`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 210. Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your mortgage application and protection insurance recommendations. Ultimately, it could prevent you from obtaining a mortgage or invalidate a future insurance claim, so it is essential that all details are correct. — I understand

- Field ID: `please_ensure_that_all_information_you_have_prov`
- Source reference: `01404e5d-41e4-4547-827d-179234d97819`
- Input: `checkbox`; required: **Yes**
- Field visibility: No additional condition.

Stored value: boolean (checked = true).

Original Typeform question title before the documented label repair:

> Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your mortgage application and protection insurance recommendations. Ultimately, it could prevent you from obtaining a mortgage or invalidate a future insurance claim, so it is essential that all details are correct.

### Admin Notes

Section ID: `s13_admin_notes`.

Section visibility: `{"field":"who_completing","operator":"eq","value":"adviser"}`

Section guidance:

> Adviser use only — not shown to clients.

**Group heading:** Adviser notes for admin

#### 211. What is the reason for this meeting? (Tell the story)

- Field ID: `admin_what_is_the_reason_for_this_meeting_tell_the_sto`
- Source reference: `f81dc490-aabc-411a-8037-c72cf374e202`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 212. What is the protection product recommended and why?

- Field ID: `admin_what_is_the_protection_product_recommended_and_w`
- Source reference: `d11eb674-9a19-4b69-86d7-8cd246273d33`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 213. What is the mortgage product recommended and why?

- Field ID: `admin_what_is_the_mortgage_product_recommended_and_why`
- Source reference: `b3473eda-fbef-42e5-925d-b93b4b7af54b`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 214. Reason for the lender and fixed term?

- Field ID: `admin_reason_for_the_lender_and_fixed_term`
- Source reference: `599a38c7-c10b-4fec-8c47-30189ac3f1ca`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 215. Reason for recommended protection sum assured

- Field ID: `admin_reason_for_recommended_protection_sum_assured`
- Source reference: `0ddf6614-70b4-40ba-a5fb-f62f4f36a9a5`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 216. Reason for protection term length

- Field ID: `admin_reason_for_protection_term_length`
- Source reference: `f4e5ef3b-a9e2-4089-ac4a-4287868896d0`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 217. Reason for mortgage term length

- Field ID: `admin_reason_for_mortgage_term_length`
- Source reference: `e98365fe-011f-43fa-b2d0-5591785d4be0`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 218. Reason for provider choice

- Field ID: `admin_reason_for_provider_choice`
- Source reference: `f921e425-8633-4834-ae1a-e741da27ab91`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 219. Additional internal notes

- Field ID: `admin_additional_internal_notes`
- Source reference: `1c7d42a2-e8f6-46de-84e5-c592a0ba288b`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

**Mortgage FactFind: 219 app questions.**

## Protection FactFind

Schema version: `1.0.0-typeform-a4Gp3Csc`. Parsed-JSON SHA-256 (JSON.stringify, independent of checkout line endings): `36378fc78c87ee075df60b1d9dcbd25f52c285ef43b75382b657c6d8553cd73a`.

Source: `a4Gp3Csc`. Sections: 12.

### Introduction

Section ID: `s1_introduction`.

Section visibility: Always available.

#### 1. Who is completing this form?

- Field ID: `who_completing`
- Source reference: `cf3c3666-af5c-4aa1-9aba-9220240ef916`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.
- Default value: `"client"`

Choices (label → stored value), in display order:

- Adviser → `adviser`
- Client → `client`

Help text:

> Choose "Adviser" to unlock the internal sections.

### Adviser Details

Section ID: `s2_adviser_details`.

Section visibility: `{"field":"who_completing","operator":"eq","value":"adviser"}`

Section guidance:

> Adviser use only — not shown to clients.

#### 2. Adviser Name

- Field ID: `adviser_name`
- Source reference: `eb7ff301-1258-423e-91d1-0f4f64ba10d0`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 3. Date of Appointment

- Field ID: `date_of_appointment`
- Source reference: `85bed86e-7881-4b86-8122-427537179854`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

### Client Source

Section ID: `s3_client_source`.

Section visibility: `{"field":"who_completing","operator":"eq","value":"adviser"}`

Section guidance:

> Adviser use only — not shown to clients.

#### 4. Source

- Field ID: `source`
- Source reference: `7ff9e10d-442d-436f-9c4b-2f32ed0d215c`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Existing Client → `existing_client`
- Referral → `referral`
- Social media → `social_media`
- Event → `event`
- Family → `family`
- Cold Call → `cold_call`
- Company Lead → `company_lead`
- Other → `other`

#### 5. If 'Other', please specify source details

- Field ID: `if_other_please_specify_source_details`
- Source reference: `9c37ad96-1541-43e9-8558-cfddb8c9f63c`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

### Applicant 1 Details

Section ID: `s4_applicant_1_details`.

Section visibility: Always available.

**Group heading:** Applicant 1 details

#### 6. Title

- Field ID: `a1_title`
- Source reference: `9d5aa651-1405-4990-84ae-1766c20563db`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 7. Full Name

- Field ID: `client_name`
- Source reference: `d14d6746-63af-471e-a27f-0e59656de688`
- Input: `text`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_name`

#### 8. Date of Birth

- Field ID: `a1_date_of_birth`
- Source reference: `8992ba69-2abf-4716-bfae-c28e26ed63f5`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 9. Gender

- Field ID: `a1_gender`
- Source reference: `9a04d88d-b9ad-42f4-8b44-61139e8e863a`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 10. Phone Number

- Field ID: `client_phone`
- Source reference: `744402b6-3ea1-438d-ba80-a5fc07252bbe`
- Input: `tel`; required: **No**
- Field visibility: No additional condition.
- Client identity role: `client_phone`

#### 11. Email

- Field ID: `client_email`
- Source reference: `6b5a6b0a-0961-43ba-9759-5ea6519ff6eb`
- Input: `email`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_email`

#### 12. Address

- Field ID: `a1_address`
- Source reference: `78d2f25c-dcdc-45bc-b64b-a04aeef84521`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 13. Marital Status

- Field ID: `a1_marital_status`
- Source reference: `82715da2-a108-4f8d-abaf-d66e991b75b4`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

**Group heading:** Applicant 1 Health Details

#### 14. Smoker/Vaper status (include amount/vape)

- Field ID: `a1_health_smoker_vaper_status_include_amount_vape`
- Source reference: `8b5bf429-f437-4890-806f-8720436dd3ae`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 15. Height

- Field ID: `a1_health_height`
- Source reference: `1e8f132f-3c67-472a-9446-91ea4d56a3df`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 16. Weight

- Field ID: `a1_health_weight`
- Source reference: `ea631859-99c9-4d60-8403-78d40aa425f7`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 17. Have you had any serious health issues in the past which may stop you from getting insurance? (Cancer, Heart Attack, Stroke, M.S, etc)

- Field ID: `a1_health_have_you_had_any_serious_health_issues_in_the_pa`
- Source reference: `71c3ff76-35c0-4f8a-884d-47a3e30855f1`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 18. Nationality

- Field ID: `a1_health_nationality`
- Source reference: `baa22df7-0ccf-42d7-81aa-29a2316fa8b9`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 19. Is this a joint case?

- Field ID: `joint_case`
- Source reference: `2772f172-e77f-498a-98ac-c325f22b0c84`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

### Applicant 2 Details

Section ID: `s5_applicant_2_details`.

Section visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

**Group heading:** Applicant 2 Details

#### 20. Title

- Field ID: `a2_title`
- Source reference: `de62e4ce-791f-4366-86b2-e7b52f1d2125`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 21. Full Name

- Field ID: `a2_full_name`
- Source reference: `40defd5c-7db2-40b0-a726-f2b918f377c8`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 22. Date of Birth

- Field ID: `a2_date_of_birth`
- Source reference: `05049236-45c8-4b0b-ac4c-37ac18482ab3`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 23. Gender

- Field ID: `a2_gender`
- Source reference: `a4be987a-dc61-4321-9167-3f89f26a07ff`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 24. Address

- Field ID: `a2_address`
- Source reference: `4166171c-42ed-4806-83c6-e26c7d8ece90`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 25. Phone Number

- Field ID: `a2_phone_number`
- Source reference: `ffc28eef-eabb-4e49-bf7e-6b930b9143bd`
- Input: `tel`; required: **No**
- Field visibility: No additional condition.

#### 26. Email

- Field ID: `a2_email`
- Source reference: `5d307b08-5cea-4b55-8aae-6b4d65f84965`
- Input: `email`; required: **No**
- Field visibility: No additional condition.

#### 27. Marital Status

- Field ID: `a2_marital_status`
- Source reference: `540d30c7-959d-47ff-aaf4-b8f72d9a7c9b`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

**Group heading:** Applicant 2 Health Details

#### 28. Smoker/Vaper status (include amount/vape)

- Field ID: `a2_health_smoker_vaper_status_include_amount_vape`
- Source reference: `8bf2cc0e-ed33-400f-b432-95828c85f2d4`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 29. Height

- Field ID: `a2_health_height`
- Source reference: `95fa1837-4ad7-4b44-aa09-ed7be20bb2fe`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 30. Weight

- Field ID: `a2_health_weight`
- Source reference: `95611eea-7e27-4b0f-bc23-b64036ff85ca`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 31. Have you had any serious health issues in the past which may stop you from getting insurance? (Cancer, Heart Attack, Stroke, M.S, etc)

- Field ID: `a2_health_have_you_had_any_serious_health_issues_in_the_pa`
- Source reference: `34dbeb5c-7ae9-4dec-b2a2-61b4abd3dc99`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 32. Nationality

- Field ID: `a2_health_nationality`
- Source reference: `566b698a-c3c1-45a4-8be3-11aa7531ad96`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

### Dependants

Section ID: `s6_dependants`.

Section visibility: Always available.

#### 33. Do you have children or dependants?

- Field ID: `has_dependants`
- Source reference: `3ce63c97-f454-40f6-8de9-031eb984dc57`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

**Group heading:** Children & Dependent Details

#### 34. Child Name

- Field ID: `dep_child_name`
- Source reference: `b2071b18-adfa-47fe-8909-ddb2d97dec9b`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 35. Child Gender

- Field ID: `dep_child_gender`
- Source reference: `d3fe1535-8b0b-4d80-a4d7-8da72c210485`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 36. Relationship to Client

- Field ID: `dep_relationship_to_client`
- Source reference: `d45e2cf2-8ee6-4bf7-aeae-29820044aef1`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 37. Dependent on (Applicant 1, Applicant 2 or Both)

- Field ID: `dep_dependent_on_applicant_1_applicant_2_or_both`
- Source reference: `03959efd-f4ba-47a0-9e1f-388f4fbd58dc`
- Input: `text`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 38. Your children will be dependant on you until what age?

- Field ID: `dep_your_children_will_be_dependant_on_you_until_wha`
- Source reference: `46836821-2fd5-4ec1-9460-8626ffa93219`
- Input: `number`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

#### 39. If you have any more children, please provide details below for ALL children.

- Field ID: `if_you_have_any_more_children_please_provide_det`
- Source reference: `7f479f50-73ee-4077-9a0b-cdfacb7fc475`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"has_dependants","operator":"eq","value":"yes"}`

Help text:

> Child name, Gender, Relationship to client(s), D.O.B, Dependant until what age

### Employment Info

Section ID: `s7_employment_info`.

Section visibility: Always available.

**Group heading:** Applicant 1 Employment Status

#### 40. Applicant 1 Employment Status

- Field ID: `a1_emp_status`
- Source reference: `862b5102-e00c-4ab0-9027-507f3c6d28d1`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Employed → `employed`
- Self Employed → `self_employed`
- Unemployed → `unemployed`
- Retired → `retired`

Original Typeform question title before the documented label repair:

> ...

#### 41. Applicant 1 Occupation

- Field ID: `a1_emp_applicant_1_occupation`
- Source reference: `5f70feba-8632-4505-a277-3d3eca042083`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 42. Applicant 1 Employer Name

- Field ID: `a1_emp_applicant_1_employer_name`
- Source reference: `68e7d428-97d6-4c23-a9d5-42089cd29333`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 43. Applicant 1 Full time or part time?

- Field ID: `a1_emp_applicant_1_full_time_or_part_time`
- Source reference: `0b2a713d-96c9-49fc-9317-8e42730aa9a1`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 44. Applicant 1 Start of employment date (or company setup date for self employed)

- Field ID: `a1_emp_applicant_1_start_of_employment_date_or_company`
- Source reference: `a69525e2-f1cd-4147-8562-f28e811adee8`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 45. If you have worked there less than 2 years please enter previous employers details below

- Field ID: `if_you_have_worked_there_less_than_2_years_pleas`
- Source reference: `f060617e-6c71-4fe5-b256-6c6f0f645468`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

Help text:

> Company name, Job title, Start and end date, Income/salary

**Group heading:** Applicant 1 Employment Info

#### 46. Applicant 1 Gross Annual Pay

- Field ID: `a1_pay_applicant_1_gross_annual_pay`
- Source reference: `c8eecb7a-0d8d-4dd0-ac59-87a11976b1a0`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 47. Applicant 1 Net Monthly Pay

- Field ID: `a1_pay_applicant_1_net_monthly_pay`
- Source reference: `760b997d-c444-4180-a8f4-5e53a1753df6`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 48. Applicant 1 Benefits received

- Field ID: `a1_pay_applicant_1_benefits_received`
- Source reference: `76c91928-3deb-41ba-964b-0eaa956d1bc1`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 49. Applicant 1 Anticipated Retirement Age

- Field ID: `a1_pay_applicant_1_anticipated_retirement_age`
- Source reference: `b90ddec8-0efb-44e2-aba3-b72bb8d636f3`
- Input: `number`; required: **No**
- Field visibility: No additional condition.

#### 50. Applicant 1 Any additional income please state below.

- Field ID: `a1_pay_applicant_1_any_additional_income_please_state_b`
- Source reference: `7d371f91-2ad4-4257-afd3-b2276c0f17dc`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

**Group heading:** Applicant 2 Employment Status

#### 51. Applicant 2 Employment Status

- Field ID: `a2_emp_applicant_2_employment_status`
- Source reference: `ccb7ec79-f464-4721-9a58-dad205958576`
- Input: `select`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Choices (label → stored value), in display order:

- Employed → `employed`
- Self Employed → `self_employed`
- Unemployed → `unemployed`
- Retired → `retired`

#### 52. Applicant 2 Occupation

- Field ID: `a2_emp_applicant_2_occupation`
- Source reference: `4a188241-7270-4d0c-9bf9-12501dc693f0`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 53. Applicant 2 Employer Name

- Field ID: `a2_emp_applicant_2_employer_name`
- Source reference: `4ac2541e-1e1c-4db6-9497-13a4698b88c5`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 54. Applicant 2 Full time or part time?

- Field ID: `a2_emp_applicant_2_full_time_or_part_time`
- Source reference: `d4301991-c1e0-44ad-b565-613fcbdf1839`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 55. Applicant 2 Start of employment date (or company setup date for self employed)

- Field ID: `a2_emp_applicant_2_start_of_employment_date_or_company`
- Source reference: `950d5f2d-0211-48be-9ed5-191e20a0f470`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 56. If you have worked there less than 2 years please enter previous employers details below

- Field ID: `if_you_have_worked_there_less_than_2_years_pleas_2`
- Source reference: `e791c1ed-5eb8-45ea-8bde-b07c527e44ad`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Company name
> Job title
> Start and end date
> Income/salary

**Group heading:** Applicant 2 Employment Info

#### 57. Applicant 2 Gross Annual Pay

- Field ID: `a2_pay_applicant_2_gross_annual_pay`
- Source reference: `9ab7b402-31b3-4802-af32-4cbca7ac5adc`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 58. Applicant 2 Net Monthly Pay

- Field ID: `a2_pay_applicant_2_net_monthly_pay`
- Source reference: `96d7bd9e-9870-4f57-9453-bc2d8f691eca`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 59. Applicant 2 Benefits received

- Field ID: `a2_pay_applicant_2_benefits_received`
- Source reference: `8a10e121-99c3-49bb-9fba-c7da4bfe32ff`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 60. Applicant 2 Anticipated Retirement Age

- Field ID: `a2_pay_applicant_2_anticipated_retirement_age`
- Source reference: `a3a042f4-2588-40e1-b550-a752af2a9c1a`
- Input: `number`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 61. Applicant 2 Any additional income please state below.

- Field ID: `a2_pay_applicant_2_any_additional_income_please_state_b`
- Source reference: `74e72641-448f-4dcb-a52c-5cf630d936ba`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

### Monthly Expenditure

Section ID: `s8_monthly_expenditure`.

Section visibility: Always available.

**Group heading:** Monthly Expenses

#### 62. Housing Costs (Rent/Mortgage)

- Field ID: `exp_housing_costs_rent_mortgage`
- Source reference: `13d128ef-a93a-4f61-a77f-ca974f514d99`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 63. Utilities (monthly)

- Field ID: `exp_utilities_monthly`
- Source reference: `ea658fdf-84d2-4bf9-ab4b-10f5322d4838`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 64. Food and Clothing (monthly)

- Field ID: `exp_food_and_clothing_monthly`
- Source reference: `2347bf5b-ef5b-43fb-ba97-d90f5d15463b`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 65. Council Tax (monthly)

- Field ID: `exp_council_tax_monthly`
- Source reference: `9b44c65e-bae6-481c-a624-82eaccd3414d`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 66. Other Insurances (monthly)

- Field ID: `exp_other_insurances_monthly`
- Source reference: `69a22d5c-0f9b-4c44-bf02-87bd0a876800`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 67. Child maintenance (monthly)

- Field ID: `exp_child_maintenance_monthly`
- Source reference: `5b5a9e57-bdb2-472a-9c91-6474b3d81cf0`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 68. Mobile (monthly)

- Field ID: `exp_mobile_monthly`
- Source reference: `1c50a91e-bc81-4e8e-8ab9-a66d19c1af1e`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 69. Motoring (monthly)

- Field ID: `exp_motoring_monthly`
- Source reference: `80eea8ec-1a22-4878-a0ad-d9283b41fb8a`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 70. Loans (monthly)

- Field ID: `exp_loans_monthly`
- Source reference: `f13e839a-910e-4554-860c-04e5924fb703`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 71. Credit cards (monthly)

- Field ID: `exp_credit_cards_monthly`
- Source reference: `e6f9bc77-2eb4-4ba9-8946-bd1a528ef273`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 72. Other Expenditure (monthly)

- Field ID: `exp_other_expenditure_monthly`
- Source reference: `360b3eee-e54a-4ea6-a6c2-870e51ef6b51`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 73. Approx Total Monthly Expenditure

- Field ID: `exp_approx_total_monthly_expenditure`
- Source reference: `9a83c909-96bd-44e1-b8e6-93a9bf2ecb87`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

### Sick Pay Info

Section ID: `s9_sick_pay_info`.

Section visibility: Always available.

**Group heading:** Applicant 1

#### 74. Do you receive any sick pay?

- Field ID: `sp1_do_you_receive_any_sick_pay`
- Source reference: `6ead8dc9-6e20-4bba-8615-fe26aa1c2341`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 75. If yes, How much sick pay do you receive?

- Field ID: `sp1_if_yes_how_much_sick_pay_do_you_receive`
- Source reference: `97bf9b15-4b7e-4bdc-bfb1-79784f0671af`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

Help text:

> Monetary amount

#### 76. How long is sick pay received for?

- Field ID: `sp1_how_long_is_sick_pay_received_for`
- Source reference: `d2f8e270-fadf-46cb-9805-10fc56f758dd`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

#### 77. Do you have any savings or other income that would help you pay your monthly bills?

- Field ID: `sp1_do_you_have_any_savings_or_other_income_that_wou`
- Source reference: `8e00a699-751b-4283-8a89-10b526396cd0`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

#### 78. If your income stopped but your bills continued. How long would you be able to pay your monthly bills for?

- Field ID: `sp1_if_your_income_stopped_but_your_bills_continued`
- Source reference: `40ff2361-f3f1-4a9b-bd87-2461dfbb3b2c`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

#### 79. After your savings have run out, how long could you continue to pay your bills for, after this?

- Field ID: `sp1_after_your_savings_have_run_out_how_long_could_y`
- Source reference: `a2538608-e855-4594-ad18-cdb3b2a6a596`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> Duration in months

**Group heading:** Applicant 2

#### 80. Do you receive any sick pay?

- Field ID: `sp2_do_you_receive_any_sick_pay`
- Source reference: `9a154d30-9e10-4cf6-af30-5d6db279241f`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

#### 81. If yes, How much sick pay do you receive?

- Field ID: `sp2_if_yes_how_much_sick_pay_do_you_receive`
- Source reference: `0fd777d0-e5be-4289-a5fa-827298c2ade9`
- Input: `currency`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Monetary amount

#### 82. How long is sick pay received for?

- Field ID: `sp2_how_long_is_sick_pay_received_for`
- Source reference: `1fb90270-1c77-40a0-b2a0-ce0daa18850c`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

#### 83. Do you have any savings or other income that would help you pay your monthly bills?

- Field ID: `sp2_do_you_have_any_savings_or_other_income_that_wou`
- Source reference: `e0d0f938-6d7b-476b-9c27-924957e93eb8`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

#### 84. If your income stopped but your bills continued. How long would you be able to pay your monthly bills for?

- Field ID: `sp2_if_your_income_stopped_but_your_bills_continued`
- Source reference: `14ae1259-b088-4db3-8f58-904d8adbbb05`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

#### 85. After your savings have run out, how long could you continue to pay your bills for, after this?

- Field ID: `sp2_after_your_savings_have_run_out_how_long_could_y`
- Source reference: `51c48dc8-ce15-464d-9282-8bf7d5c5b1d0`
- Input: `text`; required: **No**
- Field visibility: `{"field":"joint_case","operator":"eq","value":"yes"}`

Help text:

> Duration in months

### Current Protection

Section ID: `s10_current_protection`.

Section visibility: Always available.

**Group heading:** Current protection

#### 86. Do you have anything that pays out a lump sum to your family upon death?

- Field ID: `prot_do_you_have_anything_that_pays_out_a_lump_sum_to`
- Source reference: `dcd71d4a-600d-4303-aaa5-32fa282653ed`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 87. Do you have anything that pays out a lump sum upon diagnosis of cancer, heart attack, stroke, M.S etc

- Field ID: `prot_do_you_have_anything_that_pays_out_a_lump_sum_up`
- Source reference: `34658e91-9bd5-4a73-bde6-b43d45140ecb`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 88. Do you have anything that pays off your mortgage if either applicant was to die or get ill?

- Field ID: `prot_do_you_have_anything_that_pays_off_your_mortgage`
- Source reference: `a979fd62-81e8-4614-80c1-36805c343fdd`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`
- I don't have a mortgage → `i_don_t_have_a_mortgage`

#### 89. Do you have anything in place that pays your wage if your income stops?

- Field ID: `prot_do_you_have_anything_in_place_that_pays_your_wag`
- Source reference: `fe94570c-3a3e-43ab-8d4d-1208f6a43e7f`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 90. Enter details of any existing policies you have.

- Field ID: `prot_do_you_have_anything_in_place_that_pays_your_wag_details`
- Source reference: `c74e921c-2396-4bd1-8151-8a7818b0e136`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

Help text:

> Insurance company, payout, term and monthly premium. If more than one enter all below.

### Additional Services

Section ID: `s11_additional_services`.

Section visibility: Always available.

**Group heading:** Pension information

#### 91. Do you have pensions or investments?

- Field ID: `pension_do_you_have_pensions_or_investments`
- Source reference: `b4ae0ff1-3bac-4c4e-989e-46c3002b49ac`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 92. Have your pensions/investments been reviewed?

- Field ID: `pension_have_your_pensions_investments_been_reviewed`
- Source reference: `9b885d5a-7ef8-4994-9984-51517918a1cb`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 93. Are you happy with your pensions/investments?

- Field ID: `pension_are_you_happy_with_your_pensions_investments`
- Source reference: `d9f74a72-14c2-4ae2-af3a-b2739d174746`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 94. Do you have a will?

- Field ID: `pension_has_will`
- Source reference: `361f54d4-5991-48ed-92f3-660f43cc8a85`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 95. Do you understand the consequences if you don't have a will?

- Field ID: `pension_do_you_understand_the_consequences_if_you_don_t`
- Source reference: `af32757d-08b0-4644-8fbc-b94f9599a116`
- Input: `yesno`; required: **No**
- Field visibility: `{"field":"pension_has_will","operator":"eq","value":"no"}`

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 96. Are you concerned about care fees?

- Field ID: `pension_are_you_concerned_about_care_fees`
- Source reference: `0b99a5c7-4cb3-4669-b197-b19d7b92f0eb`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 97. Is there anything specific that you would like your adviser to look at to protect you and your family?

- Field ID: `is_there_anything_specific_that_you_would_like_y`
- Source reference: `65c5c695-42e2-40ed-b5c4-57a5de6ae3f3`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 98. Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your protection insurance recommendations. Ultimately, it could prevent your insurance from paying out, so it is essential that all details are correct. — I understand

- Field ID: `please_ensure_that_all_information_you_have_prov`
- Source reference: `01404e5d-41e4-4547-827d-179234d97819`
- Input: `checkbox`; required: **Yes**
- Field visibility: No additional condition.

Stored value: boolean (checked = true).

Original Typeform question title before the documented label repair:

> Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your protection insurance recommendations. Ultimately, it could prevent your insurance from paying out, so it is essential that all details are correct.

### Admin Notes

Section ID: `s12_admin_notes`.

Section visibility: `{"field":"who_completing","operator":"eq","value":"adviser"}`

Section guidance:

> Adviser use only — not shown to clients.

**Group heading:** Adviser notes for admin

#### 99. What is the reason for this meeting? (Tell the story)

- Field ID: `admin_what_is_the_reason_for_this_meeting_tell_the_sto`
- Source reference: `f81dc490-aabc-411a-8037-c72cf374e202`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 100. Reason for recommended protection sum assured

- Field ID: `admin_reason_for_recommended_protection_sum_assured`
- Source reference: `0ddf6614-70b4-40ba-a5fb-f62f4f36a9a5`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 101. What is the protection product recommended and why?

- Field ID: `admin_what_is_the_protection_product_recommended_and_w`
- Source reference: `d11eb674-9a19-4b69-86d7-8cd246273d33`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 102. Reason for protection term length

- Field ID: `admin_reason_for_protection_term_length`
- Source reference: `f4e5ef3b-a9e2-4089-ac4a-4287868896d0`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 103. Reason for provider choice

- Field ID: `admin_reason_for_provider_choice`
- Source reference: `f921e425-8633-4834-ae1a-e741da27ab91`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 104. Additional internal notes

- Field ID: `admin_additional_internal_notes`
- Source reference: `1c7d42a2-e8f6-46de-84e5-c592a0ba288b`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

**Protection FactFind: 104 app questions.**

## Medical FactFind

Schema version: `1.0.0-typeform-xrjNX2Gg`. Parsed-JSON SHA-256 (JSON.stringify, independent of checkout line endings): `81d592e8c9d33ebcf5dd5f08831c90897e552d953f072044f1e8b2137b3912a3`.

Source: `xrjNX2Gg`. Sections: 7.

### Client Information

Section ID: `s1_client_information`.

Section visibility: Always available.

#### 1. How would you like us to address you?

- Field ID: `client_how_would_you_like_us_to_address_you`
- Source reference: `890bdb8e-0d89-4692-acfb-2819870f1ef1`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Mr → `mr`
- Mrs → `mrs`
- Miss → `miss`
- Ms → `ms`
- Dr → `dr`
- Prof → `prof`

#### 2. What is your first name?

- Field ID: `client_first_name`
- Source reference: `9e554fc9-efd4-4352-ad09-4e6834522471`
- Input: `text`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_first_name`

#### 3. What is your surname?

- Field ID: `client_last_name`
- Source reference: `4175ee47-7ec4-4817-b8ff-1fb86f2edeaf`
- Input: `text`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_last_name`

#### 4. Email address

- Field ID: `client_email`
- Source reference: `factfind-pro:client_email`
- Input: `email`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_email`

Platform addition; no original Typeform question.

#### 5. What is your date of birth?

- Field ID: `client_what_is_your_date_of_birth`
- Source reference: `9aeea245-bd92-46ed-b88b-1b91094b6d75`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 6. Which gender do you identify with?

- Field ID: `client_which_gender_do_you_identify_with`
- Source reference: `68541f07-9321-40ed-b583-23ffd9b34456`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Him → `him`
- Her → `her`

#### 7. What is your height? (ft/inches or cm)

- Field ID: `client_what_is_your_height_ft_inches_or_cm`
- Source reference: `97668dc4-e90c-4dbd-97a3-bfea7517e9bf`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 8. What is your weight? (stones/lbs or kg)

- Field ID: `client_what_is_your_weight_stones_lbs_or_kg`
- Source reference: `c9e3bd0a-64f3-4977-a6bc-af0ab4eb7d8a`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 9. What is your dress/waist size?

- Field ID: `client_what_is_your_dress_waist_size`
- Source reference: `bbb4a6ec-be5c-419a-912c-61046d877747`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

### Client Lifestyle

Section ID: `s2_client_lifestyle`.

Section visibility: Always available.

#### 10. How often do you exercise each week?

- Field ID: `lifestyle_how_often_do_you_exercise_each_week`
- Source reference: `ca4f1d40-8b6e-4257-b9b5-6964a9e0f56d`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- None → `none`
- 1-2 times → `1_2_times`
- 3-4 times → `3_4_times`
- 5+ times → `5_times`
- Daily → `daily`

#### 11. How much alcohol do you consume weekly?

- Field ID: `lifestyle_how_much_alcohol_do_you_consume_weekly`
- Source reference: `13529457-1f4a-4888-8f9d-99ae41aa519a`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- None → `none`
- 1-5 units → `1_5_units`
- 6-14 units → `6_14_units`
- 15-25 units → `15_25_units`
- 25+ units → `25_units`

#### 12. Have you been advised to lower your alcohol intake by a doctor?

- Field ID: `lifestyle_have_you_been_advised_to_lower_your_alcohol_inta`
- Source reference: `114972ac-c320-421c-b0a9-2d736145973a`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

Help text:

> If yes please state the date you were told this.

#### 13. Do you currently smoke?

- Field ID: `lifestyle_do_you_currently_smoke`
- Source reference: `bae63ab2-8c29-4bc3-9aa3-041984e24f2c`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

Original Typeform question title before the documented label repair:

> 2d. Do you currently smoke?

#### 14. Please enter all relevant info below:

- Field ID: `lifestyle_do_you_currently_smoke_details`
- Source reference: `21c7c576-3c9e-4628-92ac-fb22c9026627`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"lifestyle_do_you_currently_smoke","operator":"eq","value":"yes"}`

Help text:

> How much do you smoke per day/week?

Original Typeform question title before the documented label repair:

> 2e. Please enter all relevant info below:

#### 15. Do you use recreational drugs?

- Field ID: `lifestyle_do_you_use_recreational_drugs`
- Source reference: `92dfa0d8-18e7-4e8b-817a-52d91f570e3f`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 16. Please enter all relevant info below:

- Field ID: `lifestyle_do_you_use_recreational_drugs_details`
- Source reference: `60d5c981-a180-4d86-b992-eb3c17c520c6`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"lifestyle_do_you_use_recreational_drugs","operator":"eq","value":"yes"}`

Help text:

> Type of drug, Quantity, Date last taken, How long did you take them for, Are you still taking them plus any other relevant information.

### Family Health

Section ID: `s3_family_health`.

Section visibility: Always available.

#### 17. Before age 66, have any of your parents or siblings ever had heart disease, heart attack, diabetes, cancer, muscular dystrophy, Huntington's, motor neurone disease, MS, Parkinson's, Alzheimer's, kidney/bowel disease, or other hereditary disorders?

- Field ID: `family_before_age_66_have_any_of_your_parents_or_siblin`
- Source reference: `8bb1fc2c-e0e4-4c10-9805-96ad63290572`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 18. Please provide details: which relation(s), age at diagnosis, type, and if hereditary testing has been offered to you.

- Field ID: `family_before_age_66_have_any_of_your_parents_or_siblin_details`
- Source reference: `98be399c-02d0-40b0-a91e-d996f5f7cea4`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"family_before_age_66_have_any_of_your_parents_or_siblin","operator":"eq","value":"yes"}`

#### 19. Are both of your parents still alive?

- Field ID: `family_parents_alive`
- Source reference: `3729a5b7-d189-4bd6-9b83-65738a4338a8`
- Input: `radio`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`
- One Deceased → `one_deceased`

#### 20. If no, at what age did they pass away?

- Field ID: `family_if_no_at_what_age_did_they_pass_away`
- Source reference: `ee1819ed-8d9c-4389-add0-9159d18fa657`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"family_parents_alive","operator":"in","value":["no","one_deceased"]}`

Help text:

> e.g., Father, 72, Heart Disease

### Your Health

Section ID: `s4_your_health`.

Section visibility: Always available.

#### 21. Have you ever had, or do you currently have, any of the following: cancer, tumours, heart or artery issues, stroke, brain problems, MS, epilepsy, Parkinson's or other neurological problems, tested positive for HIV or hepatitis, or mental health concerns requiring treatment?

- Field ID: `health_have_you_ever_had_or_do_you_currently_have_any_o`
- Source reference: `f1e5511e-3cc4-4bdc-b65f-c2c689fd0b8c`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 22. If yes, please provide details of the condition(s), date diagnosed, type/severity, frequency of symptoms, most recent symptoms, treatment, medication, time off work, hospitalisations, or complications.

- Field ID: `health_have_you_ever_had_or_do_you_currently_have_any_o_details`
- Source reference: `fd51bc49-8b25-49b3-b6c6-af6eb3f82573`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health_have_you_ever_had_or_do_you_currently_have_any_o","operator":"eq","value":"yes"}`

Help text:

> If more than 1 condition enter all of them below

#### 23. In the last five years, have you had: raised blood pressure/cholesterol, chest pain, diabetes, raised blood sugar, anaemia, blood clot, blood disorders, growths, lumps, cysts, polyps, asthma, bronchitis, sleep apnoea, lung/breathing issues, Crohn's disease, colitis, IBS, digestive issues, urinary infection, kidney/bladder issues, abnormal smear tests, liver/pancreas issues, back/neck issues, joint/muscle pain, injuries, numbness, muscle weakness, fainting, ear/eye issues, CFS, depression, stress or anxiety?

- Field ID: `health_in_the_last_five_years_have_you_had_raised_blood`
- Source reference: `7e1d45b4-0af3-428c-bccc-e668172f3003`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 24. If yes, provide details of conditions, dates, treatment, and current status.

- Field ID: `health_in_the_last_five_years_have_you_had_raised_blood_details`
- Source reference: `af6cf0c5-588c-4b13-abc5-7db76dbdef37`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health_in_the_last_five_years_have_you_had_raised_blood","operator":"eq","value":"yes"}`

### Your Health Continued (Last 5 Years)

Section ID: `s5_your_health_continued_last_5_years`.

Section visibility: Always available.

#### 25. Have you visited your GP, hospital or clinic for any medical advice, treatments, or tests in the last 5 years for any reason at all?

- Field ID: `health5_have_you_visited_your_gp_hospital_or_clinic_for`
- Source reference: `2381b7ec-76d7-4b82-90be-e69379e556cf`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 26. If yes, please provide information here

- Field ID: `health5_have_you_visited_your_gp_hospital_or_clinic_for_details`
- Source reference: `49430b7a-dbe7-4936-b7b3-c3eeff8e7e65`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_have_you_visited_your_gp_hospital_or_clinic_for","operator":"eq","value":"yes"}`

Help text:

> Conditions, Dates, Treatment (is it still ongoing?)

#### 27. Have you been prescribed medication or treatment for two weeks or more in the last 2 years?

- Field ID: `health5_have_you_been_prescribed_medication_or_treatment`
- Source reference: `3dc14a2b-a26e-4d5d-a319-62df38c6c36c`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 28. If yes, please provide information here

- Field ID: `health5_have_you_been_prescribed_medication_or_treatment_details`
- Source reference: `04c59a11-e319-447d-81f0-7a00e47cf7a8`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_have_you_been_prescribed_medication_or_treatment","operator":"eq","value":"yes"}`

Help text:

> Reason for medication, Medication name, Time taking it, Frequency, Dosage

#### 29. Have you been referred to any counselling or therapy?

- Field ID: `health5_have_you_been_referred_to_any_counselling_or_the`
- Source reference: `3ada98e4-da41-4611-be21-e8c1facf0c0a`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 30. If yes, please provide information here

- Field ID: `health5_have_you_been_referred_to_any_counselling_or_the_details`
- Source reference: `6a133370-f99a-48b5-b83e-130126179175`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_have_you_been_referred_to_any_counselling_or_the","operator":"eq","value":"yes"}`

Help text:

> Date when started, Duration, Is it still ongoing?

#### 31. Have you been asked to attend a follow-up or regular review with a doctor, hospital or clinic in the last 2 years?

- Field ID: `health5_have_you_been_asked_to_attend_a_follow_up_or_reg`
- Source reference: `92ab9012-a526-4fcd-b1c9-f1100fa13080`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 32. If yes, please provide information here

- Field ID: `health5_have_you_been_asked_to_attend_a_follow_up_or_reg_details`
- Source reference: `37022161-06bc-49c1-b4a0-dc9a872522e3`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_have_you_been_asked_to_attend_a_follow_up_or_reg","operator":"eq","value":"yes"}`

Help text:

> Condition, Last review, Current status if ongoing

#### 33. Have you been referred to or consulted a specialist in the last 5 years?

- Field ID: `health5_have_you_been_referred_to_or_consulted_a_special`
- Source reference: `970eec27-769a-4c6a-9b58-e46553227ced`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 34. If yes, please provide information here

- Field ID: `health5_have_you_been_referred_to_or_consulted_a_special_details`
- Source reference: `1ae7fae5-2313-45d1-acc6-c7f7083b6096`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_have_you_been_referred_to_or_consulted_a_special","operator":"eq","value":"yes"}`

Help text:

> Condition, Reason for referral, Any other relevant info

#### 35. In the last five years, have you had any other medical conditions or symptoms not already disclosed?

- Field ID: `health5_in_the_last_five_years_have_you_had_any_other_me`
- Source reference: `21632cd6-508e-4c2c-b894-a739d1861e41`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 36. If yes, please provide information here

- Field ID: `health5_in_the_last_five_years_have_you_had_any_other_me_details`
- Source reference: `d1a27619-ab39-4615-9f1d-ad8c33419493`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_in_the_last_five_years_have_you_had_any_other_me","operator":"eq","value":"yes"}`

Help text:

> Condition, Medication, Treatment, Dates, Any other relevant information

#### 37. Have you suffered any symptoms or tested positive for Covid in the last three months?

- Field ID: `health5_have_you_suffered_any_symptoms_or_tested_positiv`
- Source reference: `c60658dd-a8f1-4c8b-a8b2-64f98291d47e`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 38. If yes, please provide information here

- Field ID: `health5_have_you_suffered_any_symptoms_or_tested_positiv_details`
- Source reference: `4a8d539f-555a-4216-a544-398b831b64fb`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_have_you_suffered_any_symptoms_or_tested_positiv","operator":"eq","value":"yes"}`

Help text:

> Dates, Symptoms, Is it still ongoing?

#### 39. In the last five years, have you been banned from driving for any reason?

- Field ID: `health5_in_the_last_five_years_have_you_been_banned_from`
- Source reference: `4eecb380-41b3-4db0-b3fd-123891683587`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 40. If yes, please provide information here

- Field ID: `health5_in_the_last_five_years_have_you_been_banned_from_details`
- Source reference: `a6982089-e8e1-4a2d-8298-fd415fa479de`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_in_the_last_five_years_have_you_been_banned_from","operator":"eq","value":"yes"}`

Help text:

> Dates & Reason for ban

#### 41. In the last five years, have you spent more than 30 days outside the UK or EU at once, in one calendar year?

- Field ID: `health5_in_the_last_five_years_have_you_spent_more_than`
- Source reference: `adcbee78-a3d8-4925-89e0-51b57e528ded`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 42. If yes, please provide information here

- Field ID: `health5_in_the_last_five_years_have_you_spent_more_than_details`
- Source reference: `2b20a22b-7edf-4985-87e3-3500f2808ac9`
- Input: `textarea`; required: **No**
- Field visibility: `{"field":"health5_in_the_last_five_years_have_you_spent_more_than","operator":"eq","value":"yes"}`

Help text:

> Which country/countries, Duration, Reason for trip

### GP info

Section ID: `s6_gp_info`.

Section visibility: Always available.

#### 43. What is your GP's name?

- Field ID: `gp_what_is_your_gp_s_name`
- Source reference: `c2292798-5799-4452-8939-96b708a649e8`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 44. Surgery phone number

- Field ID: `gp_surgery_phone_number`
- Source reference: `8da024e1-00ca-4529-adca-4b24fe6199c0`
- Input: `tel`; required: **No**
- Field visibility: No additional condition.

#### 45. Surgery full address

- Field ID: `gp_surgery_full_address`
- Source reference: `c0d4ba10-4ef2-4dab-a7b2-93b8fcf1f3c3`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

Help text:

> Including postcode

#### 46. What is the name of your surgery?

- Field ID: `gp_what_is_the_name_of_your_surgery`
- Source reference: `0e581e62-0c43-4baa-8ea8-3c9c5a9a35a5`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

### Additional Information

Section ID: `s7_additional_information`.

Section visibility: Always available.

#### 47. Is there anything else about your medical history past or present you haven't shared above? Please include any doctor's appointments, diagnoses, injuries, or illnesses, even minor ones.

- Field ID: `additional_is_there_anything_else_about_your_medical_histor`
- Source reference: `f9de5845-5904-4756-ae8b-f9ec53db6ee3`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

Help text:

> Condition, Dates, Treatment, All relevant info

#### 48. Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your insurance application. Ultimately, it could prevent you from obtaining coverage or the most suitable product for you, so it is essential that all details are correct. — I understand

- Field ID: `additional_please_ensure_that_all_information_you_have_prov`
- Source reference: `60ad0961-4e45-4762-81f1-499d4147a59c`
- Input: `checkbox`; required: **Yes**
- Field visibility: No additional condition.

Stored value: boolean (checked = true).

Original Typeform question title before the documented label repair:

> Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your insurance application. Ultimately, it could prevent you from obtaining coverage or the most suitable product for you, so it is essential that all details are correct.

**Medical FactFind: 48 app questions.**

## Home FactFind

Schema version: `1.0.0-typeform-R3CNRtla`. Parsed-JSON SHA-256 (JSON.stringify, independent of checkout line endings): `2fff50024b35d993a1e5043debb48cc0783acad87d41e6dbefb20eccebb3899b`.

Source: `R3CNRtla`. Sections: 5.

### About the Proposer

Section ID: `s1_about_the_proposer`.

Section visibility: Always available.

**Group heading:** Your contact details

#### 1. First Name

- Field ID: `client_first_name`
- Source reference: `aad0d70f-1ba7-4939-9da1-5717e5b6cae6`
- Input: `text`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_first_name`

#### 2. Last Name

- Field ID: `client_last_name`
- Source reference: `7db00adf-32bf-4a0f-b3ec-318b2a22cb1a`
- Input: `text`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_last_name`

#### 3. Email Address

- Field ID: `client_email`
- Source reference: `1b477e9a-ca24-4636-9c3d-265be8ec497a`
- Input: `email`; required: **Yes**
- Field visibility: No additional condition.
- Client identity role: `client_email`

#### 4. Phone Number

- Field ID: `client_phone`
- Source reference: `f8ed5329-959f-4880-b7aa-653e7456f03b`
- Input: `tel`; required: **No**
- Field visibility: No additional condition.
- Client identity role: `client_phone`

#### 5. Company Name

- Field ID: `contact_company_name`
- Source reference: `a8ba8be5-76de-44ae-91fb-9a4f990bbb82`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 6. When is your date of birth?

- Field ID: `when_is_your_date_of_birth`
- Source reference: `1ced2075-d76c-4795-bf5c-02e4fb826d4e`
- Input: `date`; required: **No**
- Field visibility: No additional condition.

#### 7. What is your occupation?

- Field ID: `what_is_your_occupation`
- Source reference: `268d0efd-444e-4fec-b470-5f8f9903df4f`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 8. What is your marital status?

- Field ID: `what_is_your_marital_status`
- Source reference: `74b1fadd-1759-4d92-9c4a-735a5f04cd30`
- Input: `select`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Single → `single`
- Married → `married`
- Civil partnership → `civil_partnership`
- Separated → `separated`
- Divorced → `divorced`
- Widowed → `widowed`

### Property Details

Section ID: `s2_property_details`.

Section visibility: Always available.

#### 9. Address of the property?

- Field ID: `address_of_the_property`
- Source reference: `34843f56-adff-4b27-8512-401a5fd0373c`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 10. Type of property?

- Field ID: `type_of_property`
- Source reference: `fff7448f-4310-4fed-b960-68f87a8e3cb6`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 11. Ownership status?

- Field ID: `ownership_status`
- Source reference: `2c7e09c9-d968-4e5e-a343-c78ad99c5769`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 12. Year built?

- Field ID: `year_built`
- Source reference: `59afa8f4-6415-453b-86c9-9d9ec8f06a1c`
- Input: `number`; required: **No**
- Field visibility: No additional condition.

#### 13. Number of bedrooms?

- Field ID: `number_of_bedrooms`
- Source reference: `4cfa95e6-d22d-468e-8d8e-41e813f543eb`
- Input: `number`; required: **No**
- Field visibility: No additional condition.

#### 14. Number of bathrooms?

- Field ID: `number_of_bathrooms`
- Source reference: `74a4a18e-55df-45df-af63-2e0ef0ad6e67`
- Input: `number`; required: **No**
- Field visibility: No additional condition.

#### 15. Wall and roof materials?

- Field ID: `wall_and_roof_materials`
- Source reference: `105f2db3-40b1-436a-a535-57e2cd83a70c`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 16. History of flooding (Yes/No)?

- Field ID: `history_of_flooding_yes_no`
- Source reference: `e17bc29f-f5e5-4449-9140-8e9decf05233`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 17. History of subsidence (Yes/No)?

- Field ID: `history_of_subsidence_yes_no`
- Source reference: `175eb830-1487-4ca8-b5a9-cf322b2f9403`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

### Occupancy & Security

Section ID: `s3_occupancy_and_security`.

Section visibility: Always available.

#### 18. Who lives at the property?

- Field ID: `who_lives_at_the_property`
- Source reference: `edb60bc1-1c6d-47f4-b3bb-e83e9e95f9a9`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

#### 19. Is the property left unoccupied for more than 30 days in one 12-month period?

- Field ID: `is_the_property_left_unoccupied_for_more_than_30`
- Source reference: `432469b5-1621-41d9-a360-df333e55a76e`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 20. Is the property used for business purposes?

- Field ID: `is_the_property_used_for_business_purposes`
- Source reference: `92297251-3f01-42c5-8a23-912358a1895c`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 21. Type of door and window locks?

- Field ID: `type_of_door_and_window_locks`
- Source reference: `802d7880-316c-464d-a3ef-baa51122eb58`
- Input: `text`; required: **No**
- Field visibility: No additional condition.

#### 22. Alarm systems present?

- Field ID: `alarm_systems_present`
- Source reference: `ee0a3376-174c-4441-856f-9e864a4c9bca`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

### Cover Required

Section ID: `s4_cover_required`.

Section visibility: Always available.

#### 23. What is the total sum insured for buildings?

- Field ID: `what_is_the_total_sum_insured_for_buildings`
- Source reference: `7c6ff91e-69a1-42f1-8e26-9c6e89df79b2`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 24. What is the contents sum insured?

- Field ID: `what_is_the_contents_sum_insured`
- Source reference: `8139351d-2f54-4707-966a-d85fcbb0dcd3`
- Input: `currency`; required: **No**
- Field visibility: No additional condition.

#### 25. Do you require accidental damage cover?

- Field ID: `do_you_require_accidental_damage_cover`
- Source reference: `d8d9d21b-f6fa-4f33-bcfd-7bd08fb2b224`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 26. Please list any high-value personal possessions you want covered away from home.

- Field ID: `please_list_any_high_value_personal_possessions`
- Source reference: `48775b34-f7dd-44a0-8f7c-6ac1711c0194`
- Input: `textarea`; required: **No**
- Field visibility: No additional condition.

### History

Section ID: `s5_history`.

Section visibility: Always available.

#### 27. Have you made any home insurance claims in the past 5 years?

- Field ID: `have_you_made_any_home_insurance_claims_in_the_p`
- Source reference: `a2b3a4fd-4a6a-40df-ac66-eaabafb385d6`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 28. Has your insurance ever been cancelled or refused?

- Field ID: `has_your_insurance_ever_been_cancelled_or_refuse`
- Source reference: `9344c241-d708-4dad-b2a2-75839ca5c889`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 29. Have you or anyone living at the property ever been convicted of a criminal offence?

- Field ID: `have_you_or_anyone_living_at_the_property_ever_b`
- Source reference: `f88a0feb-8588-4155-9e28-92620c28eac6`
- Input: `yesno`; required: **No**
- Field visibility: No additional condition.

Choices (label → stored value), in display order:

- Yes → `yes`
- No → `no`

#### 30. Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your home insurance application. Ultimately, it could invalidate a future claim, so it is essential that all details are correct. — I Agree

- Field ID: `please_ensure_that_all_information_you_have_prov`
- Source reference: `fa5c9ec9-9866-4d64-9472-47e6e5fa7146`
- Input: `checkbox`; required: **Yes**
- Field visibility: No additional condition.

Stored value: boolean (checked = true).

Original Typeform question title before the documented label repair:

> Please ensure that all information you have provided is true, accurate, and complete. Providing incorrect or incomplete information may affect your home insurance application. Ultimately, it could invalidate a future claim, so it is essential that all details are correct.

**Home FactFind: 30 app questions.**
