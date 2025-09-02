const development = {
  overrides: {
    server: {
      port: 3000,
      environment: 'development' as const,
    },
  },
};

export default development;
