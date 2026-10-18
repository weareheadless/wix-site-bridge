// Activate only after the human places a NEW WixFormsV2 form and its exact
// element ID/field keys have been confirmed. Never guess legacy form keys.
export const restorationFormConfig = {
 enabled: false,
 collapseNative: false,
 elementId: null,
 fields: { name: null, email: null, subject: null, message: null },
};
