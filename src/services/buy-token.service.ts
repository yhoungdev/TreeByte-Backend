// src/services/buy-token.service.ts
import supabase from '@/lib/db/db';
import { simulateSorobanBuyCall } from '@/lib/soroban/soroban-client';

type BuyTokenParams = {
  project_id: number;
  user_id: number;
  amount: number;
};

export const handleBuyToken = async ({ project_id, user_id, amount }: BuyTokenParams) => {
  // Verificar que exista el proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  // Verificar que exista el usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  // Validar trustline (simulado)
  const hasTrustline = true; // TODO: reemplazar por lógica real
  if (!hasTrustline) {
    throw new Error('User does not have a trustline for this asset.');
  }

  // Llamada simulada al contrato Soroban
  const txConfirmation = await simulateSorobanBuyCall({
    buyerAddress: user.wallet_address,
    projectAsset: project.asset_code,
    amount,
  });

  // Registrar la compra
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert([
      {
        user_id,
        project_id,
        amount,
        purchase_date: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (purchaseError) {
    console.error(purchaseError);
    throw new Error('Failed to record purchase');
  }

  return {
    message: 'Token purchase successful',
    transaction: txConfirmation,
    purchase,
  };
};
