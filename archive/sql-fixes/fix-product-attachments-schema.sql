-- =====================================================
-- FIX PRODUCT ATTACHMENTS SCHEMA
-- Krishisethu Inventory Management System
-- =====================================================
-- Purpose: Create separate table for product attachments
-- This provides better organization and scalability
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create product_attachments table
CREATE TABLE IF NOT EXISTS public.product_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- File information
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT, -- Storage path for management
    file_type TEXT NOT NULL, -- MIME type (image/jpeg, application/pdf, etc.)
    file_size BIGINT DEFAULT 0, -- File size in bytes
    
    -- Storage information
    storage_bucket TEXT DEFAULT 'product-documents',
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Additional file metadata
    description TEXT, -- Optional description for the attachment
    
    -- File categorization
    attachment_type TEXT DEFAULT 'document', -- 'image', 'document', 'certificate', etc.
    is_primary BOOLEAN DEFAULT false, -- Mark primary image/document
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_attachments_product_id ON product_attachments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attachments_type ON product_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_product_attachments_active ON product_attachments(is_active);
CREATE INDEX IF NOT EXISTS idx_product_attachments_primary ON product_attachments(is_primary) WHERE is_primary = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_attachments_updated_at 
    BEFORE UPDATE ON product_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE product_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all attachments
CREATE POLICY "Users can view product attachments" ON product_attachments
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert attachments
CREATE POLICY "Authenticated users can insert product attachments" ON product_attachments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own attachments or managers can update any
CREATE POLICY "Users can update product attachments" ON product_attachments
    FOR UPDATE USING (
        uploaded_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policy: Users can delete their own attachments or managers can delete any
CREATE POLICY "Users can delete product attachments" ON product_attachments
    FOR DELETE USING (
        uploaded_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Create a view for easy querying with product information
CREATE OR REPLACE VIEW product_attachments_with_product AS
SELECT 
    pa.*,
    p.name as product_name,
    p.code as product_code,
    u.email as uploaded_by_email
FROM product_attachments pa
LEFT JOIN products p ON pa.product_id = p.id
LEFT JOIN users u ON pa.uploaded_by = u.id
WHERE pa.is_active = true;

-- Grant permissions
GRANT ALL ON product_attachments TO authenticated;
GRANT ALL ON product_attachments_with_product TO authenticated;

-- Insert some sample data for testing (optional)
-- This will be populated by the application when users upload files

COMMENT ON TABLE product_attachments IS 'Stores file attachments for products including images, documents, certificates, etc.';
COMMENT ON COLUMN product_attachments.attachment_type IS 'Type of attachment: image, document, certificate, manual, etc.';
COMMENT ON COLUMN product_attachments.is_primary IS 'Marks the primary image or document for the product';
COMMENT ON COLUMN product_attachments.metadata IS 'Additional metadata like upload source, dimensions, etc.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Product attachments schema created successfully!';
    RAISE NOTICE '📋 Table: product_attachments';
    RAISE NOTICE '🔍 Indexes: Created for performance';
    RAISE NOTICE '🔒 RLS: Enabled with appropriate policies';
    RAISE NOTICE '👁️ View: product_attachments_with_product';
END $$;
