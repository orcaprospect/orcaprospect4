/**
 * EXEMPLO de resposta esperada por um provider customizado
 * (CUSTOM_PROVIDER_URL). Use este arquivo apenas como referência —
 * ele não é importado pela aplicação.
 *
 * A resposta pode ser um array direto ou o objeto { companies: [...] }.
 */

export const CUSTOM_PROVIDER_EXAMPLE_RESPONSE = {
  companies: [
    {
      // Obrigatório: identificador ÚNICO e estável na sua fonte
      externalId: "abc-123",
      // Obrigatório
      name: "Marcenaria Modelo",
      // Opcionais:
      category: "Marcenaria",
      city: "Santo André",
      state: "SP",
      country: "Brasil",
      address: "Rua Exemplo, 123 - Centro",
      website: "https://www.exemplo.invalid",
      instagram: "@marcenariamodelo",
      phone: "+55 11 0000-0000",
      whatsapp: "+55 11 0000-0000",
      email: "contato@exemplo.invalid",
      description: "Descrição pública da empresa.",
      services: ["Móveis sob medida", "Projetos personalizados"],
      // Sinais verificados pela SUA fonte (use null quando não verificado):
      signals: {
        website: true,
        whatsapp: true,
        contactForm: true,
        budgetRequests: true,
        catalog: false,
        instagramActive: true,
      },
      sourceUrl: "https://sua-fonte.exemplo.invalid/abc-123",
    },
  ],
  // Aviso opcional exibido na interface:
  notice: undefined,
};
