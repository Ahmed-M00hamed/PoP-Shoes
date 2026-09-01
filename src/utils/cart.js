import { supabase } from '../supabaseClient'
import { getGuestId } from './guestId'

export async function addToCart(productId, variantId, quantity = 1) {
    const guestId = await getGuestId()

    // نشوف الأول لو نفس الـ variant (لون+مقاس) ده موجود بالفعل في كارت الزائر
    const { data: existing, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('guest_id', guestId)
        .eq('variant_id', variantId)
        .maybeSingle()

    if (fetchError) throw fetchError

    if (existing) {
        const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id)

        if (updateError) throw updateError
    } else {
        const { error: insertError } = await supabase
            .from('cart_items')
            .insert({ guest_id: guestId, product_id: productId, variant_id: variantId, quantity })

        if (insertError) throw insertError
    }
}